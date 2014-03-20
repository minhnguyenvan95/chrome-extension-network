// Poll for a socket

var socket_timeout = setInterval(function() {
  if (window.socket) {
    console.log('[sio]Global socket found.');
    clearInterval(socket_timeout);

    console.log(window.socket.$events);

    // Session ID to differentiate sockets
    var socket_id = window.socket.socket ? window.socket.socket.sessionid : 0;

    // Handle an arbitrary socket event
    var handleSocketEvent = function(evt) {
      window.socket.on(evt, function(msg, txt) {
        var socket_obj = {
          socket_id: socket_id,
          type: evt,
          args: arguments
        };

        console.log(socket_obj);

        document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
          detail: socket_obj
        }));
      });
    }

    // Handle all socket events
    for (evt in window.socket.$events) {
      handleSocketEvent(evt);
    }

  }
}, 150);
