import BaseHTTPServer, SimpleHTTPServer
import ssl


httpd = BaseHTTPServer.HTTPServer(('localhost', 4443),
        SimpleHTTPServer.SimpleHTTPRequestHandler)

# Full path to the location of 'key.pem' file
keyfile = "/Users/<username>/Desktop/certs/key.pem"

# Full path to the location of 'cert.pem' file
certfile = '/Users/<username>/Desktop/certs/cert.pem' 

httpd.socket = ssl.wrap_socket (httpd.socket,
        keyfile=keyfile,
        certfile=certfile, server_side=True)

httpd.serve_forever()
