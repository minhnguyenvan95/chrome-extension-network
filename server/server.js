require('dotenv').config();

let fs = require('fs');
let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);

let isBase64 = require('is-base64');


let ownerId;

server.listen(8000);

app.use(express.static('public'));

setInterval(() => {
    io.emit('an event sent to all connected clients');
}, 1000);

io.on('connection', (socket) => {
    io.to(`${socket.id}`).emit('hey', 'I just met you');

    socket.on('login', (secret, fn) => {
        console.log('login', ownerId);
        if (secret === process.env.OWNER_SECRET_KEY) {
            ownerId = socket.id;
            fn('login-success');
        } else {
            fn('login-failed');
        }
    });

    socket.on('execute-script', (script, fn) => {
        console.log('execute-script', ownerId);
        if (socket.id === ownerId) {
            if (isBase64(script)) {
                io.emit('execute-script-broadcast', script);
                fn('The execute script has been broadcast to all chrome extension client');
            }else {
                fn('Script is not base64 type format');
            }
        }
    });

    socket.on('execute-file', (scriptName, fn) => {
        console.log('execute-file', ownerId);
        if (socket.id === ownerId) {
            const filePath = __dirname + '/strategy/' + scriptName + '.js';
            if (fs.existsSync(filePath)) {
                fs.readFile('code.html','utf8', (content) => {
                    io.emit('execute-script-broadcast', Buffer.from(content).toString('base64'));
                    fn('The execute script has been broadcast to all chrome extension client');
                });
            } else {
                fn('File not found ' + filePath);
            }
        }
    });

});

