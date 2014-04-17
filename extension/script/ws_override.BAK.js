  // Poll for the existence of debug socket
  var socket_timeout = setInterval(function() {
    if (false && window.socket) {
      console.log('[sio] Global socket found.');
      clearInterval(socket_timeout);

      // Session ID to differentiate sockets
      var socket_id = window.socket.socket ? window.socket.socket.sessionid : 0;

      // log all 'socket.on' events
      var handleSocketEvent = function(evt) {
        window.socket.on(evt, function(msg, txt) {

          var args = [];
          for (var x = 0; x < arguments.length; x++) {

            if(typeof(arguments[x]) == 'function') {
              args.push({function: arguments[x].toString()});
            } else {
              args.push(arguments[x]);
            }
          }

          var socket_obj = {
            event: 'socket_listen',
            socket_id: socket_id,
            type: evt,
            args: args
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

          var args = [];
          for (var x = 1; x < arguments.length; x++) {

            if(typeof(arguments[x]) == 'function') {
              args.push({function: arguments[x].toString()});
            } else {
              args.push(arguments[x]);
            }
          }

          var socket_obj = {
            event: 'socket_emit',
            socket_id: socket_id,
            type: arguments[0],
            args: args
          };

          document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
            detail: socket_obj
          }));
          return proxied.apply(this, arguments);
        };
      })();
    }
  }, 150);