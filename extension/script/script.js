// Can't use chrome.extension stuff in this script, can access page globals

// Poll for the existence of debug socket
var socket_timeout = setInterval(function() {
  if (window.WebSocket) {
   
    // add logging onmessage listener
    function captureRecv(ws) {
      if (typeof ws.captured == 'undefined') {
        debugger;
        ws.addEventListener('message', function(e) {
          var event = {
              event: 'websocket_recv',
              from: location,
              data: e.data,
              url: e.target.URL
          }
          log(event);
        });
        ws.captured = true;
      }
    }
   
    // capture sending
    var captureSend = window.WebSocket.prototype.send = function() {
      debugger;
      captureRecv(this); // in case socket contruction was before constructor switching
      var event = {
          event: 'websocket_send',
          from: location,
          data: arguments[0],
          url: this.URL
      };
   
      // console.log(event);
      return window.WebSocket.prototype.send.apply(this, arguments);
    }
   
    // capture constructor
    window.WebSocket = function(a,b) {
      var base;
      base = (typeof b !== "undefined") ? new WebSocket(a,b) : new WebSocket(a);
      captureRecv(base);
      base.send = captureSend;
      this.__proto__ = WebSocket.constructor;
      return base;
    }
  }

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
