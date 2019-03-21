chrome.runtime.sendMessage({
    cmd: 'message-delivery',
    param: {
        type: 'socket.io-message-event',
        object: {
            exampleObject: {},
            anotherString: '2'
        }
    }
}, (response) => {
    console.log(response);
});