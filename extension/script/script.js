// Poll for a socket

var socket_timeout = setInterval(function() {
  if (window.socket) {
    console.log('nerp');
    clearInterval(socket_timeout);

    console.log(window.socket.$events);

    window.socket.on('text', function(msg, txt) {
      console.log('gotmsg');
      document.dispatchEvent(new CustomEvent('E123', {
        detail: msg + ': ' + txt
      }));
    });
  }
}, 150);
