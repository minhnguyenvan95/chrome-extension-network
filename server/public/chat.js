window.onload = function () {
    let socket = io.connect();
    let nickname;

    socket.on('connect', function () {
        // Get user nickname
        nickname = prompt('What is your nickname?');
        socket.emit('join', nickname);

        // show the chat
        document.getElementById('chat').style.display = 'block';
    });

    socket.on('announcement', function (msg) {
        let li = document.createElement('li');
        li.className = 'announcement';
        li.innerHTML = msg;
        document.getElementById('messages').appendChild(li);
    });

    socket.on('text', addMessage);
    socket.on('numbers', addMessage);
    socket.on('object', addMessage);

    function addMessage(from) {
        let args = Array.prototype.slice.call(arguments);
        let messages = args.slice(1);
        console.log(messages);

        let li = document.createElement('li');
        li.className = 'message';
        let inner = '<b>' + from + '</b>: ';

        for (msg in messages) {
            inner = inner + ' ' + messages[msg];
        }

        li.innerHTML = inner;

        document.getElementById('messages').appendChild(li);
        return li;
    }

    let input = document.getElementById('input');
    document.getElementById('form').onsubmit = function () {

        // Visually add message from self
        console.log(input.value);
        let li = addMessage('me', input.value);

        // determine the type of chat message from the first word
        let message = input.value.split(' ');
        switch (message[0]) {
            // Tests variable number of arguments + callback fn
            case 'numbers':
                socket.emit('numbers', 0, 1, 2, function (date) {
                    li.className = 'confirmed';
                    li.title = date;
                });
                break;
            // Tests objects + nested objects
            case 'object':
                socket.emit('object', 'test_1', undefined, {
                    a: 'test_2',
                    b: 42,
                    c: {d: 'test_3'}
                });
                break;
            default:  // text
                socket.emit('text', input.value, function (date) {
                    li.className = 'confirmed';
                    li.title = date;
                });
                break;
        }

        // reset the input
        input.value = '';
        input.focus();

        return false;
    }
}
