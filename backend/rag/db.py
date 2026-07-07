import os
import shutil
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger("lex-backend")

# Storage paths
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rag_db"))
KNOWLEDGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "knowledge"))

os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

# Global variables initialized on demand
_embed_model = None
_chroma_client = None
_collection = None

def get_embed_model():
    global _embed_model
    if _embed_model is None:
        logger.info("Initializing SentenceTransformer model 'all-MiniLM-L6-v2'...")
        from sentence_transformers import SentenceTransformer
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embed_model

def get_chroma_collection():
    global _chroma_client, _collection
    if _chroma_client is None:
        logger.info(f"Initializing ChromaDB client at {DB_PATH}...")
        import chromadb
        _chroma_client = chromadb.PersistentClient(path=DB_PATH)
        _collection = _chroma_client.get_or_create_collection(name="lex_knowledge")
    return _collection

def extract_text_from_file(file_path: str) -> str:
    """Extracts text content from TXT, PDF, and DOCX files."""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
            
    elif ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
        except Exception as e:
            logger.error(f"Error reading PDF {file_path}: {e}")
            return ""
            
    elif ext in (".docx", ".doc"):
        try:
            from docx import Document
            doc = Document(file_path)
            text = []
            for paragraph in doc.paragraphs:
                text.append(paragraph.text)
            return "\n".join(text)
        except Exception as e:
            logger.error(f"Error reading Word document {file_path}: {e}")
            return ""
            
    return ""

def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """Splits text into chunks of specified size and overlap."""
    if not text:
        return []
    words = text.split()
    chunks = []
    step = chunk_size - chunk_overlap
    if step <= 0:
        step = chunk_size
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
    return chunks

def add_document_to_db(file_path: str) -> int:
    """Extracts, chunks, embeds, and adds a single document file to ChromaDB."""
    filename = os.path.basename(file_path)
    text = extract_text_from_file(file_path)
    if not text or not text.strip():
        logger.warning(f"No text extracted from file {filename}")
        return 0
        
    chunks = chunk_text(text)
    if not chunks:
        return 0
        
    model = get_embed_model()
    collection = get_chroma_collection()
    
    # Compute embeddings in batch
    embeddings = model.encode(chunks).tolist()
    
    ids = []
    documents = []
    metadatas = []
    
    for idx, chunk in enumerate(chunks):
        doc_id = f"{filename}_chunk_{idx}"
        ids.append(doc_id)
        documents.append(chunk)
        metadatas.append({"source": filename, "chunk_index": idx})
        
    # Add to Chroma
    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )
    
    logger.info(f"Ingested {len(chunks)} chunks from {filename} into ChromaDB")
    return len(chunks)

def rebuild_chromadb_index() -> Dict[str, any]:
    """Clears ChromaDB and rebuilds it by parsing all files in knowledge directory."""
    global _chroma_client, _collection
    
    # Force close client and reload if necessary
    collection = get_chroma_collection()
    
    # Clean database collection
    try:
        _chroma_client.delete_collection(name="lex_knowledge")
    except Exception:
        pass
    _collection = _chroma_client.get_or_create_collection(name="lex_knowledge")
    
    files = [f for f in os.listdir(KNOWLEDGE_DIR) if os.path.isfile(os.path.join(KNOWLEDGE_DIR, f))]
    ingested_files = []
    total_chunks = 0
    
    for f in files:
        file_path = os.path.join(KNOWLEDGE_DIR, f)
        try:
            chunks_count = add_document_to_db(file_path)
            if chunks_count > 0:
                ingested_files.append(f)
                total_chunks += chunks_count
        except Exception as e:
            logger.error(f"Failed to process file {f}: {e}")
            
    return {
        "success": True,
        "total_files": len(files),
        "ingested_files": ingested_files,
        "total_chunks": total_chunks
    }

def query_rag_knowledge(query: str, top_k: int = 10) -> Tuple[str, List[Dict]]:
    """Queries ChromaDB for context matching the user query."""
    collection = get_chroma_collection()
    if collection.count() == 0:
        return "", []
        
    model = get_embed_model()
    query_embedding = model.encode([query]).tolist()[0]
    
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        
        context = ""
        sources = []
        
        for idx, doc in enumerate(documents):
            meta = metadatas[idx] if idx < len(metadatas) else {}
            source_file = meta.get("source", "Unknown Knowledge File")
            context += f"[Source: {source_file}]\n{doc}\n\n"
            
            # Avoid duplicating source objects
            if not any(s["name"] == source_file for s in sources):
                sources.append({"name": source_file, "type": "file"})
                
        return context.strip(), sources
    except Exception as e:
        logger.error(f"Error querying ChromaDB: {e}")
        return "", []

def list_knowledge_files() -> List[Dict]:
    """Lists files in the knowledge directory along with status."""
    if not os.path.exists(KNOWLEDGE_DIR):
        return []
    files = []
    for f in os.listdir(KNOWLEDGE_DIR):
        path = os.path.join(KNOWLEDGE_DIR, f)
        if os.path.isfile(path):
            files.append({
                "name": f,
                "size": os.path.getsize(path),
                "type": os.path.splitext(f)[1].replace(".", "").upper()
            })
    return files
