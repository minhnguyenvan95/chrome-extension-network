let socket = io('http://localhost:8000');
socket.on('connect', () => {
    console.info('Connect to websocket');
});
socket.on('hey', (data) => {
    console.log(data);
});
socket.on('disconnect', () => {
    console.info('Websocket disconnect')
});