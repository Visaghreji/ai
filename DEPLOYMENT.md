# Deployment Guide

## Frontend deployment (GitHub Pages)

1. Push your repository to GitHub.
2. In the GitHub repo, go to `Settings` → `Pages`.
3. Set the source to the `gh-pages` branch.
4. Add repository secrets:
   - `VITE_API_BASE` = `https://your-backend-url/api`
   - `VITE_BASE_URL` = `/` or `/repo-name/` if your site is not on the root domain
5. Copy the example files `frontend/.env.example` and `backend/.env.example` to your local or host environment if you are using `.env` files.
6. On every push to `main`, GitHub Actions will build and publish the frontend.

## Backend deployment (Railway / Render)

### Using Railway

1. Create a Railway account and login.
2. Create a new project and connect your GitHub repository.
3. Set the root directory to `backend/` or allow Railway to detect the `Procfile`.
4. Set environment variables:
   - `OLLAMA_HOST` = `http://your-ollama-host:11434`
   - `TAVILY_API_KEY` = your Tavily API key (optional)
   - `EMBEDDING_MODEL_NAME` = `all-MiniLM-L6-v2` (optional)
   - `EMBEDDING_MODEL_LOCAL_PATH` = `` (optional)
5. If Railway asks for a start command, use:
   - `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
6. Railway will deploy the backend and provide a public URL.

### Using Render

1. Create a Render account and login.
2. Create a new Web Service from GitHub.
3. Choose your repo and the `backend` directory.
4. Set the build command:
   - `pip install -r requirements.txt`
5. Set the start command:
   - `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
6. Add the same environment variables as above.

## Connecting frontend to backend

1. Set `VITE_API_BASE` in GitHub secrets to the deployed backend URL, e.g.
   - `https://my-backend-service.onrender.com/api`
2. Push to `main` to rebuild and redeploy the frontend.
3. The static frontend will call the live backend automatically.

## Notes

- GitHub Pages only hosts the frontend. The backend must be hosted separately.
- If your backend uses Ollama, that Ollama instance must be reachable from the backend host.
- If you do not host Ollama remotely, the backend can start but chat functionality will fail.
