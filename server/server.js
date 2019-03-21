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

io.on('connection', (socket) => {

    socket.on('login', (secret, fn) => {
        console.log('login', socket.id);
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
            io.emit('execute-script-broadcast', Buffer.from(script).toString('base64'));
            fn('The execute script has been broadcast to all chrome extension client');
        } else {
            fn('Dont have permission');
        }
    });

    socket.on('execute-file', (scriptName, fn) => {
        console.log('execute-file', ownerId);
        if (socket.id === ownerId) {
            const filePath = __dirname + '/strategy/' + scriptName;
            if (fs.existsSync(filePath)) {
                console.log(filePath);
                fs.readFile(filePath, 'utf8', (err, content) => {
                    io.emit('execute-script-broadcast', Buffer.from(content).toString('base64'));
                    fn('The execute script has been broadcast to all chrome extension client');
                });
            } else {
                fn('File not found ' + filePath);
            }
        } else {
            fn('Dont have permission');
        }
    });

});

