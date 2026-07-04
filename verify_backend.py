import urllib.request
import json
import sys
import time

def verify_endpoints():
    base_url = "http://127.0.0.1:8000/api"
    endpoints = [
        ("/progress", "GET"),
        ("/history", "GET"),
        ("/profile", "GET"),
        ("/admin/ollama-status", "GET")
    ]
    
    print("Testing connection to FastAPI server...")
    time.sleep(2)  # Wait for startup
    
    all_ok = True
    for path, method in endpoints:
        url = base_url + path
        try:
            req = urllib.request.Request(url, method=method)
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                data = json.loads(response.read().decode("utf-8"))
                print(f"[SUCCESS] {method} {url} - Status: {status}")
                if path == "/admin/ollama-status":
                    print(f"  Ollama Online: {data.get('online')}")
                    print(f"  lex model found: {data.get('has_lex_model')}")
        except Exception as e:
            print(f"[FAILED] {method} {url} - Error: {e}")
            all_ok = False
            
    if all_ok:
        print("\nAll endpoints verified successfully!")
        sys.exit(0)
    else:
        print("\nSome endpoints failed verification.")
        sys.exit(1)

if __name__ == "__main__":
    verify_endpoints()
