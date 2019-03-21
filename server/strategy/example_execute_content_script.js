let data = {
    type: "FROM_EXTENSION_CONTENT_SCRIPT",
    payload: {
        cmd: 'message-delivery',
        param: {
            type: 'logger',
            object: 'execute-logger: ' + Math.random() * 1000
        }
    }
};

let z = `
    console.log('Execute as page script');
    window.postMessage(${JSON.stringify(data)}, "*");
    `;
injectScript(z);