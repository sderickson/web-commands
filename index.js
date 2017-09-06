var http = require('http');
var fs = require('fs');
console.log(__dirname+'/main.html');
var indexHtml = fs.readFileSync(__dirname+'/index.html');
var commandsHtml = fs.readFileSync(__dirname+'/commands.html');
const urls = require('./urls');
const { spawn } = require('child_process');

var logs = [];

const addToLogs = function (cssClass) {
  return (data) => {
    let lines = data.toString().split('\n');
    lines = lines.map((l) => `<div class="${cssClass}">${l}</div>`)
    logs = logs.concat(lines);
  }
};

var server = http.createServer(function (request, response) {
  try {
    if (urls[request.url]) {
      response.writeHead(200, {"Content-Type": "text/plain"});
      const child = spawn.apply(this, urls[request.url]);
      child.stdout.pipe(response);
      child.stdout.on('data', addToLogs('log'));
    }
    else if (request.url === '/logs') {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.end(`<pre>${logs.join('')}</pre>`)
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
