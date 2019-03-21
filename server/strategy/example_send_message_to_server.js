chrome.runtime.sendMessage({
    cmd: 'message-delivery',
    param: {
        type: 'socket.io-message-event',
        object: {
            exampleObject: {},
            anotherString: '2'
        }
    }
}, (error, response) => {
    if (error) {
        throw error;
    }
    console.log(response);
});