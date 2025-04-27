import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Configuration
PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))  # Current directory

# Change to the appropriate directory
os.chdir(DIRECTORY)

# Print message
print(f"Starting server at http://localhost:{PORT}")
print(f"Serving files from: {DIRECTORY}")
print("Press Ctrl+C to stop the server")

# Open browser
webbrowser.open(f"http://localhost:{PORT}/html/index.html")

# Custom handler for redirects
class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle successful sign-in redirect
        if self.path == '/signin-success':
            self.send_response(302)
            self.send_header('Location', '/html/homepage.html')
            self.end_headers()
            return
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

# Create and start the server
Handler = CustomHandler
httpd = socketserver.TCPServer(("", PORT), Handler)

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
    httpd.server_close()
