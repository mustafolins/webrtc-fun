const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
const handleRequest = function(request, response) {
  // Render the single client html file for any request the HTTP server receives
  console.log('request received: ' + request.url);

  if(request.url === '/consumer') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('client/consumer.html'));
  } else if(request.url === '/producer') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('client/producer.html'));
  } else if(request.url === '/webrtc.js') {
    response.writeHead(200, {'Content-Type': 'application/javascript'});
    response.end(fs.readFileSync('client/webrtc.js'));
  } // analyze page
  else if(request.url === '/faceDetection.js'){
    response.writeHead(200, {'Content-Type':'application/javascript'});
    response.end(fs.readFileSync('client/faceDetection.js'));
  } else if(request.url === '/face-api.min.js'){
    response.writeHead(200, {'Content-Type':'application/javascript'});
    response.end(fs.readFileSync('client/face-api.min.js'));
  } else if(request.url === '/analyze') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('client/consumerAnalyze.html'));
  } else if(request.url.includes('shard')){
    response.writeHead(200, {'Content-Type': 'application/octet-stream'})
    response.end(fs.readFileSync('client' + request.url))
  } else if(request.url.includes('/models')){
    response.writeHead(200, {'Content-Type': 'application/json'})
    response.end(fs.readFileSync('client' + request.url))
  }
};

const httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({server: httpsServer});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
  ws.onclose = (event) => console.log('closed: event code ' + event.code);
  ws.onerror = (error) => console.error(error)
});

wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + '/producer and https://localhost:' + HTTPS_PORT + '/consumer and https://localhost:' + HTTPS_PORT + '/analyze in Firefox/Chrome.\n'
);
