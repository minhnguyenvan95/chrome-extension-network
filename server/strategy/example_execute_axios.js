chrome.runtime.sendMessage({
    cmd: 'axios-request',
    param: {
        method:'get',
        url:'https://jsonplaceholder.typicode.com/todos/'
    }
}, (response) => {
    console.log(response);
});