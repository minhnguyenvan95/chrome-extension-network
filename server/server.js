let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);

server.listen(8000);

app.use(express.static('public'));

io.on('connection', function (socket) {
    socket.on('join', function (name) {
        socket.nickname = name;
        socket.broadcast.emit('announcement', name + ' joined the chat.');
    });

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