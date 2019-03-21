$(document).ready(() => {
    let socket = io.connect('http://localhost:8000');

    socket.on('connect', function () {
        socket.on('logging', (sender, message) => {
            addMessageItem(`${sender}`, '[LOGGER] ' + message);
        });

        socket.on('owner-interact', (sender, message, callbackStringFunc) => {
            addMessageItem(`${sender}`, '[OWNER-INTERACT]');
        });
    });

    let textArea = $('#formControlTextArea1');
    $('form').submit((e) => {
        e.preventDefault();

        const type = $('#formControlSelect1 :selected').val();
        const command = textArea.val().trim();
        addMessageItem('owner', command);

        socket.emit(type, command, (response) => {
            addMessageItem('server', type + ' >>>>> ' + response);
        });

        textArea.focus();

        return false;
    })

    function addMessageItem(from) {

        const liLength = $('#messages li').length;

        if (liLength > 100) {
            $('#messages > :last').detach();
        }

        let args = Array.prototype.slice.call(arguments);
        let messages = args.slice(1);

        let li = document.createElement('li');
        li.className = 'list-group-item';
        let inner = '<b>' + from + '</b>: ';

        for (let msg in messages) {
            inner = inner + ' ' + messages[msg];
        }

        li.innerHTML = inner;

        $('#messages').prepend(li);
        return li;
    }
})