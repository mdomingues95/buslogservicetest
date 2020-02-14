#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(9090, function () {
    console.log((new Date()) + ' Server is listening on port 9090');
});

wsServer = new WebSocketServer({
    httpServer: server,

    autoAcceptConnections: false
});

var monitorings = [];

var motoristasConnections = [];

var motoristas = [

];


function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function (message) {
        if (message.type === 'utf8') {

            var data = JSON.parse(message.utf8Data);

            if (data.type == "login_monitoring") {

                console.log("cliente monitoring logged");
                monitorings.push(connection);
                connection.sendUTF(JSON.stringify({ type: "todos_motoristas", value: motoristas.filter(x => x != null) }));
                return;

            }

            if (data.type == "login_motorista") {

                motoristasConnections.push(connection);
                // console.log(data);
                motoristas[data.value.user.Id] = data.value;


                if (data.value.itens.length == 0) {
                    delete motoristas[data.value.user.Id];
                    monitorings.forEach(m => {
                        m.sendUTF(JSON.stringify({ type: "todos_motoristas", value: motoristas.filter(x => x != null) }));
                    })
                    return;

                }

                var date = new Date().toLocaleString('pt-BR', {
                    timeZone: 'America/Recife'
                });


                motoristas[data.value.user.Id].lastView = date;

                //console.log(JSON.stringify(motoristas[data.value.user.Id]));

                monitorings.forEach(m => {
                    m.sendUTF(JSON.stringify({ type: "todos_motoristas", value: motoristas.filter(x => x != null) }));
                })
                //  console.log("motorista logged");
                return;
            }

            if (data.type == "update_motorista") {

                motoristas[data.value.user.Id].user = data.value.user;


                var date = new Date().toLocaleString('pt-BR', {
                    timeZone: 'America/Recife'
                });


                motoristas[data.value.user.Id].lastView = date;

                monitorings.forEach(m => {
                    m.sendUTF(JSON.stringify({ type: "update_motorista", value: motoristas[data.value.user.Id] }));
                })


            }






            return;


            //  console.log('Received Message: ' + );

            //   connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {

            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });

    connection.on('close', function (reasonCode, description) {
        if (motoristasConnections.indexOf(connection) >= 0) {
            motoristasConnections.splice(motoristasConnections.indexOf(connection), 1);
            console.log(motoristasConnections)
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' mt.');
        } else {
            monitorings.splice(monitorings.indexOf(connection), 1);
            console.log(monitorings)
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' mo.');
        }

    });

});