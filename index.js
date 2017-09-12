var https = require('https');
var fs = require('fs');
const urls = require('./commands');
const { spawn } = require('child_process');
_ = require('lodash');
const key = fs.readFileSync('server.key').toString();
const cert = fs.readFileSync('server.crt').toString();
const pwd = _.trim(fs.readFileSync('pwd').toString());
const options = { key, cert };
const parseBody = require('parse-body');

var logs = [];

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send(JSON.stringify(logs));
});

const addToLogs = function (cssClass) {
  return (data) => {
    let lines = data.toString().split('\n');
    lines = lines.filter((l) => l);
    lines = lines.map((l) => { return { t: cssClass, d: l } });
    logs = logs.concat(lines);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(lines));
      }
    });
  }
};

var server = https.createServer(options, function (request, response) {
  try {
    if (urls[request.url] && request.method === 'POST') {
      parseBody(request, 1e6, function(err, body) {
        if (err) {
          response.writeHead(401);
          response.end('');
          return console.log(err);
        }
        if(body.password !== pwd) {
          console.log('body.password', body.password !== pwd)
          response.writeHead(401);
          return response.end('');
        }
        response.writeHead(200, {"Content-Type": "text/plain"});
        const child = spawn.apply(this, urls[request.url]);
        child.stdout.on('data', addToLogs('log'));
        child.stderr.on('data', addToLogs('err'));
        response.end('');
      });
    }
    else if (request.url === '/commands') {
      var commandsHtml = fs.readFileSync(__dirname+'/commands.html');
      response.writeHead(200, {"Content-Type": "text/html"});
      let buttons = Object.keys(urls).map((key) => {
        return `<button onclick="runCommand('${key}')">${urls[key][0]}</button>`;
      });
      response.end(_.template(commandsHtml)({ buttons: buttons.join(' ') }));
    }
    else {
      var indexHtml = fs.readFileSync(__dirname+'/index.html');
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
