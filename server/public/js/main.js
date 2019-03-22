

$(document).ready(() => {

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

    let socket = io.connect('http://localhost:8000');

    socket.on('connect', function () {
        socket.on('logging', (sender, message) => {
            addMessageItem(`${sender}`, '[LOGGER] ' + message);
        });

        socket.on('owner-interact', (sender, request) => {
            addMessageItem(`${sender}`, 'Request [OWNER-INTERACT] from client');
            handleOwnerInteract(sender, request);
        });
    });

    function handleOwnerInteract(sender, request) {
        // FIXME: should handle interact request from client here

        switch (request.interactType) {
            case 'launchpad-resolve-captcha': // client request owner to resolve its captcha
                const htmlEl = `
                <form class="form-inline launchpad-resolve-captcha" data-sender-id="${sender}">
                    <fieldset>
                      <img src='${request.param.image}'/>&nbsp;
                      <input name="captcha" type="text" class="form-control mb-2 mr-sm-2">
                      <button type="submit" class="btn btn-primary mb-2">Enter</button>
                    </fieldset>
                </form>`;

                addOwnerInteractRequest(sender, htmlEl);

                setTimeout(() => {
                    document.querySelector('input[name=captcha]').focus()
                }, 500)

                $('.launchpad-resolve-captcha').on('submit', (e) => {
                    e.preventDefault();
                    $(e.target).find('fieldset').attr('disabled', 'disabled');
                    const captcha = $(e.target).find('input[name=captcha]').val();
                    socket.emit('execute-script-individual', sender, `(${request.callback})('${captcha}')`, (response) => {
                        addMessageItem('server', response);
                    });
                    return true;
                });
                break;
        }
    }

    function addOwnerInteractRequest(from) {

        const liLength = $('#owner-interact li').length;

        if (liLength > 100) {
            $('#owner-interact > :last').detach();
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

        $('#owner-interact').prepend(li);
        return li;
    }

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