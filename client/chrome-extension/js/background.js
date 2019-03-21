let socket = io('http://localhost:8000');
socket.on('connect', () => {
    console.info('Connect to websocket');
});

socket.on('execute-script-broadcast', (base64Encode) => {
    const jsText = atob(base64Encode);
    console.log(base64Encode);
    executeScriptInActiveTab(jsText);
});


socket.on('disconnect', () => {
    console.info('Websocket disconnect')
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