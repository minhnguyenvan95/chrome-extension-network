let socket = io('http://localhost:8000');
socket.on('connect', () => {
    console.info('Connect to websocket');

    socket.on('execute-script', (base64Encode) => {
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
                    let ret = socket.send(request.param.type, request.param.object);
                    callback(ret);
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

function executeScriptInActiveTab(jsText) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
            const activeTab = tabs[0];
            chrome.tabs.executeScript(activeTab.id, {
                code: jsText,
                runAt: "document_idle"
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                }
            });
        }
    });
}