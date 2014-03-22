// Can't use chrome.extension stuff in this script, can access page globals

// Poll for the existence of debug socket
var socket_timeout = setInterval(function() {
  if (window.socket) {
    console.log('[sio] Global socket found.');
    clearInterval(socket_timeout);

    // Session ID to differentiate sockets
    var socket_id = window.socket.socket ? window.socket.socket.sessionid : 0;

    // log all 'socket.on' events
    var handleSocketEvent = function(evt) {
      window.socket.on(evt, function(msg, txt) {
        var socket_obj = {
          event: 'socket_listen',
          socket_id: socket_id,
          type: evt,
          args: arguments
        };

        document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
          detail: socket_obj
        }));
      });
    }

    for (evt in window.socket.$events) {
      handleSocketEvent(evt);
    }

    // log all 'socket.emit events'
    (function() {
      var proxied = window.socket.emit;
      window.socket.emit = function() {
        var socket_obj = {
          event: 'socket_emit',
          socket_id: socket_id,
          type: arguments[0],
          args: [arguments[1]]
        };

        document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
          detail: socket_obj
        }));
        return proxied.apply(this, arguments);
      };
    })();
  }
}, 150);
