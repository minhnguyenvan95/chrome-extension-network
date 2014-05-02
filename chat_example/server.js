// deps
var express = require('express')
  , sio = require('socket.io');

// create app
app = express.createServer(
  express.bodyParser()
  , express.static('public')
);

// listen
app.listen(8000);

// sio
var io = sio.listen(app);

io.sockets.on('connection', function(socket){
	socket.on('join', function(name){
		socket.nickname = name;
		socket.broadcast.emit('announcement', name + ' joined the chat.');
	    });
    });
io.sockets.on('connection', function (socket) {

  socket.on('text', function (msg, fn) {
    socket.broadcast.emit('text', socket.nickname, msg);

    // confirm the reception
    fn(Date.now());
  });
  
  socket.on('numbers', function (n1, n2, n3, fn) {
    socket.broadcast.emit('numbers', socket.nickname, n1, n2, n3);

    // confirm the reception
    fn(Date.now());
  });

  socket.on('object', function (txt, num, obj) {
    socket.broadcast.emit('object', socket.nickname, txt, num, obj);
  });

});

// only use xhr for now
// io.set('transports', ['xhr-polling']);
