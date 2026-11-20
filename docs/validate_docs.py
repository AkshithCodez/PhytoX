import os
import sys

def test_validate_docs():
    doc_dir = os.path.join("docs", "claude-project-context")
    if not os.path.isdir(doc_dir):
        print(f"Error: {doc_dir} not found")
        sys.exit(1)
    
    files = [f for f in os.listdir(doc_dir) if f.endswith(".md")]
    if len(files) < 24:
        print(f"Error: Expected at least 24 markdown files, found {len(files)}")
        sys.exit(1)
        
    master = os.path.join(doc_dir, "PHYTOX_COMPLETE_PROJECT_CONTEXT.md")
    if not os.path.exists(master):
        print(f"Error: {master} not found")
        sys.exit(1)
        
    size = os.path.getsize(master)
    if size < 10000:
        print(f"Error: {master} is too small ({size} bytes)")
        sys.exit(1)
        
    print(f"PASS: Verified {len(files)} documentation files in {doc_dir}. Master file is {size:,} bytes.")

if __name__ == "__main__":
    validate()
