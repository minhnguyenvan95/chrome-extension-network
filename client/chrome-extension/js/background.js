let socket = io('http://localhost:8000');
socket.on('connect', () => {
    console.info('Connect to websocket');

    socket.on('execute-script', (base64Encode) => {
        socket.emit('logger', 'Executing script from client');

        const jsText = atob(base64Encode);
        console.log(base64Encode);
        executeScriptInActiveTab(jsText);
    });

    socket.on('disconnect', () => {
        console.info('Websocket disconnect')
    });
});

chrome.runtime.onMessage.addListener((request, sender, callback) => {
    console.info('Received request in background');
    console.log(request);

    if (!callback) {
        console.error('callback is required');
    }

    if (request) {
        switch (request.cmd) {
            case 'axios-request':
                axios(request.param)
                    .then((result) => (callback(result)))
                    .catch((error) => callback(new Error(JSON.stringify(error))));
                break;
            case 'message-delivery':
                if (socket.connected) {
                    socket.emit(request.param.type, request.param.object);
                    callback({});
                } else {
                    callback(new Error('Socket is not connected.'))
                }
                break;
        }
    } else {
        callback(new Error('Message can\'t be empty'));
    }
    return true;
});

function executeScriptInActiveTab(rawJs) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
            const activeTab = tabs[0];

            chrome.tabs.executeScript(activeTab.id, {
                file: './js/content.js',
                runAt: "document_idle"
            }, () => {

                const jsText = `
                    try {
                        ${rawJs}
                    } catch(err) {
                        console.error(err);
                        chrome.runtime.sendMessage({ cmd: 'message-delivery', param: { type: 'logger', object: 'execute-error: ' + JSON.stringify(err.message) } }, (response) => {});
                    }
                `;

                chrome.tabs.executeScript(activeTab.id, {
                    code: jsText,
                    runAt: "document_idle"
                }, () => {
                    if (chrome.runtime.lastError) {
                        socket.emit('logger', chrome.runtime.lastError.message);
                        console.error(chrome.runtime.lastError.message);
                    }
                });
            });
        }
    });
}