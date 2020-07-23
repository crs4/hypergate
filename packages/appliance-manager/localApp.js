const jsonfile = require('jsonfile');
const WiFiControl = require('wifi-control');
const fs = require('fs');

var http = require("http");
var url = require("url");


function start() {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        request.setEncoding("utf8");
        var body = '';
        request.addListener("data", function (dataChunk) {
            body += dataChunk;
        });

        request.addListener("end", function () {
            try { request.body = JSON.parse(body); }
            catch (e) {
                request.body = body;
            }
            route(handle, pathname, request, response);
        });
        //route(handle, pathname, request, response);
    }

    http.createServer(onRequest).listen(3000);
    console.log("*** Local App Server running at: http://localhost:3000");
}

function route(handle, pathname, request, response) {
    if (typeof handle[pathname] === 'function') {
        handle[pathname](request, response);
    } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write("404 Not found");
        response.end();
    }
}

var handle = {};
handle["/clientId"] = function (request, response) {
    const clientId = jsonfile.readFileSync('config.json').clientId;
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write(`Your local application ID is: ${clientId}`);
    response.end();
}

handle["/wifi"] = function (request, response) {
    if (request.method === 'GET') {
        fs.readFile('networkSettings.html', (err, data) => {
            if (err) {
                response.writeHead(404, { "Content-Type": "text/plain" });
                response.write("404 Not found");
                response.end();
            }
            response.writeHead(404, { "Content-Type": "text/html" });
            response.write(data);
            response.end();
        })
    } else if (request.method === 'POST') {
        //console.log('Data: ' + JSON.stringify(request.body));
        var _ap = {};
        if (typeof request.body === 'object') {
            _ap = request.body
            response.writeHead(200, { "Content-Type": "text/plain" });
        } else {
            var settings = new url.URLSearchParams(request.body);
            if (!settings.has('ssid') || !settings.has('password')) {
                response.writeHead(400, { "Content-Type": "text/plain" });
                response.write(`invalid data`);
            }
            response.writeHead(200, { "Content-Type": "text/plain" });
            _ap.ssid = settings.get('ssid');
            _ap.password = settings.get('password');
        }
        console.log('*** New wifi settings: ' + JSON.stringify(_ap));
        response.write(`connecting to network...`);
        //response.write(res);
        response.end();
        var results = WiFiControl.connectToAP(_ap, function (err, res) {
            if (err) {
                console.log(err);
            }
            console.log(res);

        });
    }

}

//  Initialize wifi-control package with verbose output
WiFiControl.init({
    debug: true
});

module.exports = { start };