var http = require('http');
var fs = require('fs');
console.log(__dirname+'/main.html');
var indexHtml = fs.readFileSync(__dirname+'/index.html');
var commandsHtml = fs.readFileSync(__dirname+'/commands.html');
const urls = require('./urls');
const { spawn } = require('child_process');

var logs = [];

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send(logs.join(''));
});

const addToLogs = function (cssClass) {
  return (data) => {
    let lines = data.toString().split('\n');
    lines = lines.map((l) => `<div class="${cssClass}">${l}</div>`)
    logs = logs.concat(lines);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(lines.join(''));
      }
    });
  }
};

var server = http.createServer(function (request, response) {
  try {
    if (urls[request.url]) {
      response.writeHead(200, {"Content-Type": "text/plain"});
      const child = spawn.apply(this, urls[request.url]);
      child.stdout.pipe(response);
      child.stdout.on('data', addToLogs('log'));
      child.stderr.on('data', addToLogs('err'));
    }
    else if (request.url === '/logs') {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.end(`<pre>${logs.join('')}</pre>`);
    }
    else if (request.url === '/commands') {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.end(commandsHtml);
    }
    else {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.end(indexHtml);
    }
  }
  catch (e) {
    console.log(e)
  }
});

server.listen(8000);

console.log("Server running at http://127.0.0.1:8000/");
