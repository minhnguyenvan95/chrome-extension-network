(function() {
  var scriptName = "ws_override.js";
  var captured = false;
  if (typeof oWebSocket == "undefined") {
    var oWebSocket = WebSocket;
    console.log("this:");
    console.log(this);
  }

  if (!captured) {
    // add logging onmessage listener
    function captureRecv(ws) {
      if (typeof ws.capturedRecv == 'undefined') {
        ws.addEventListener('message', function(e) {
          if (e.data && this.url && 
              (this.url.indexOf("/socket.io") >= 0) ||
                (this.url.indexOf("/engine.io") >= 0)) {
            var dataStart = e.data.indexOf('{');
            if (dataStart >= 0) {
              var obj = JSON.parse(e.data.substring(dataStart));

              var socket_obj = {
                  event: 'socket_listen',
                  socket_id: this.socketId,
                  type: obj.name,
                  args: obj.args
              };
              document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
                detail: socket_obj 
              }));
            }
          }
        });
        ws.capturedRecv = true;
      }
    }

    // capture sending
    var captureSend = function() {
      captureRecv(this); // in case socket contruction was before constructor switching
      var data = arguments[0];
      if (data && this && this.URL && this.URL.indexOf && 
          (this.url.indexOf("/socket.io") >= 0) || 
            (this.url.indexOf("/engine.io") >= 0)) {
        var dataStart = data.indexOf('{');
        if (dataStart >= 0) {
          var obj = JSON.parse(data.substring(data.indexOf('{')));

          var socket_obj = {
            event: 'socket_emit',
            socket_id: this.socketId,
            type: obj.name,
            args: obj.args
          };
          document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
            detail: socket_obj
          }));
        }
      }
      return oWebSocket.prototype.send.apply(this, arguments);
    }

    cWebSocket = function(a,b) {
      var base;
      base = (typeof b !== "undefined") ? new oWebSocket(a,b) : new oWebSocket(a);
      captureRecv(base);
      base.send = captureSend;
      this.__proto__ = oWebSocket.constructor;
      var urlTokens = base.url.split('/');
      base.socketId = urlTokens[urlTokens.length-1];
      return base;
    };
    captured = true;
  }

  var scriptId = -1;
  for (var i = 0; i < document.scripts.length; i++) {
    if (document.scripts[i].src.indexOf(scriptName) >= 0) {
      scriptId = i;
      break;
    }
  }
  if (scriptId >= 0 && document.scripts[scriptId].getAttribute("should-override-sockets") == "true") {
    window.WebSocket = cWebSocket;
  } else {
    window.WebSocket = oWebSocket;
  }

  // enable toggling between WebSocket versions
  document.addEventListener('Socket.io.StartMonitor', function(e) {
    window.WebSocket = cWebSocket;
  });
  document.addEventListener('Socket.io.StopMonitor', function(e) {
    window.WebSocket = oWebSocket;
  });
})();
