import BaseHTTPServer, SimpleHTTPServer
import ssl


httpd = BaseHTTPServer.HTTPServer(('localhost', 4443),
        SimpleHTTPServer.SimpleHTTPRequestHandler)

httpd.socket = ssl.wrap_socket (httpd.socket,
        keyfile="/Users/kshamaz/Desktop/certs/key.pem",
        certfile='/Users/kshamaz/Desktop/certs/cert.pem', server_side=True)

httpd.serve_forever()
