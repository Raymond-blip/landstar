import http.server
import socketserver
import os

# Change to the correct directory
os.chdir(r"c:\Downloaded Web Sites\www.landstar.com")

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Serving from: {os.getcwd()}")
    httpd.serve_forever()

