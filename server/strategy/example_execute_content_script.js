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
    let zdata = ${JSON.stringify(data)};
    window.postMessage(zdata, "*");
    `;

let script = document.createElement('script');
script.appendChild(document.createTextNode(z));
(document.body || document.head || document.documentElement).appendChild(script);