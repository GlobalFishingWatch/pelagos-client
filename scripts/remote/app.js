#! /usr/bin/env nodejs
var app = require('express')();

var enableCORS = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, *');

    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    };
};

app.use(enableCORS);

var server = require('http').Server(app);
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  socket.emit('id', {id:socket.id});
  socket.on('msg', function (data) {
    data.origin = socket.id;
    io.emit('msg', data);
  });
});

server.listen(4711);
console.log("Listening on port 4711");
