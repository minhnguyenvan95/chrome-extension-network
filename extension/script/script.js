// Poll for a socket

var socket_timeout = setInterval(function() {
  if (window.socket) {
    console.log('nerp');
    clearInterval(socket_timeout);

    document.dispatchEvent(new CustomEvent('E123', {
      detail: window.socket.name
    }));
  }
}, 150);
