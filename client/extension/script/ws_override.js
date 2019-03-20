(function () {
    let scriptName = "ws_override.js";
    let captured = false;
    if (typeof oWebSocket == "undefined") {
        let oWebSocket = WebSocket;
    }

    if (!captured) {
        // add logging onmessage listener
        function captureRecv(ws) {
            if (typeof ws.capturedRecv == 'undefined') {
                ws.addEventListener('message', function (e) {
                    if (e.data && this.url &&
                        (this.url.indexOf("/socket.io") >= 0) ||
                        (this.url.indexOf("/engine.io") >= 0)) {
                        let dataStart = e.data.indexOf('{');
                        if (dataStart >= 0) {
                            let obj = JSON.parse(e.data.substring(dataStart));

                            let socket_obj = {
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
        let captureSend = function () {
            captureRecv(this); // in case socket contruction was before constructor switching
            let data = arguments[0];
            if (data && this && this.URL && this.URL.indexOf &&
                (this.url.indexOf("/socket.io") >= 0) ||
                (this.url.indexOf("/engine.io") >= 0)) {
                let dataStart = data.indexOf('{');
                if (dataStart >= 0) {
                    let obj = JSON.parse(data.substring(data.indexOf('{')));

                    let socket_obj = {
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

        cWebSocket = function (a, b) {
            let base;
            base = (typeof b !== "undefined") ? new oWebSocket(a, b) : new oWebSocket(a);
            captureRecv(base);
            base.send = captureSend;
            this.__proto__ = oWebSocket.constructor;
            let urlTokens = base.url.split('/');
            base.socketId = urlTokens[urlTokens.length - 1];
            return base;
        };
        captured = true;
    }

    let scriptId = -1;
    for (let i = 0; i < document.scripts.length; i++) {
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
    document.addEventListener('Socket.io.StartMonitor', function (e) {
        window.WebSocket = cWebSocket;
    });
    document.addEventListener('Socket.io.StopMonitor', function (e) {
        window.WebSocket = oWebSocket;
    });
})();
