// Poll for a socket

var socket_timeout = setInterval(function() {
  if (window.socket) {
    console.log('nerp');
    clearInterval(socket_timeout);

    console.log(window.socket.$events);

    var socket_id = window.socket.socket ? window.socket.socket.sessionid : 0;


    window.socket.on('text', function(msg, txt) {
      console.log('gotmsg');

      var socket_obj = {
        socket_id: socket_id,
        type: 'text',
        args: arguments
      };

      console.log(socket_obj);

      document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
        detail: socket_obj
      }));
    });
  }
}, 150);
