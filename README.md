# forex-app
A web-application showing historical Foreign exchange rates as a chart, and a prediction algo applied on it

# How to run the web app?
The repo has an index.html and required static assets in designated folders. 
Serving the web-app would need a web-server. Any web-server would do, we'll use python's SimpleHTTPServer for demonstration.

1. ### Install Python (if you already have it, skip to next step):
   On a Mac:
   Most Macs come with Python 2.7 already installed, but it’s good to double-check the version. To determine whether you have
   Python 2.7, open the Terminal application, type the following, and press Return:
   ```
   python -V
   ```
   This command will report the version of Python:
   ```
   Python 2.7.3
   ```
   
2. ### Setup HTTPS:
   In order to serve this web-app over `https://localhost/`, we need to create a self-signed cert/key pair.
   To do that, run the following commands:
   ```
   cd ~/Desktop
   mkdir certs
   cd certs
   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
   ...
   ...
   ```
   On running the last command (openssl), it may ask for some user inputs. Just provide those and the following cert-key files should exist in youe `~/Desktop/certs/` directory:
   ```ls -l ~/Desktop/certs/
      -rw-r--r--  1 <user>  1437157072  1208 Mar  8 08:00 cert.pem
      -rw-r--r--  1 <user>  1437157072  1858 Mar  8 08:00 key.pem
   ```
   
3. ### Edit server.py config
    Open the file server.py located at the root of this directory. Change the name of your system user in below lines:
    ```
     # Full path to the location of 'key.pem' file
     keyfile = "/Users/<username>/Desktop/certs/key.pem"
     # Full path to the location of 'cert.pem' file
     certfile = '/Users/<username>/Desktop/certs/cert.pem'
    ```
    Save the file after editing the file paths for cert.pem and key.pem (created in step:2 above) correctly.
    
4. ### Run the server
   We'll be running Python's in-built SimpleHTTPServer for our testing. The server.py file is for doing this job.
   Run the following command from the root directory of the web-app:
   ```
   python server.py
   ```
5. ### That's it! 
    Now navigate to the below url in your favorite browser and you should see the web-application:
    ```
    https://localhost:4443/index.html
    ```
