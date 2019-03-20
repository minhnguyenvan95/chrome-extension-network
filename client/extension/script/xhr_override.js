// XMLHttpRequest.js Copyright (C) 2010 Sergey Ilinsky (http://www.ilinsky.com)
//
// This work is free software; you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation; either version 2.1 of the License, or
// (at your option) any later version.

// This work is distributed in the hope that it will be useful,
// but without any warranty; without even the implied warranty of
// merchantability or fitness for a particular purpose. See the
// GNU Lesser General Public License for more details.

// You should have received a copy of the GNU Lesser General Public License
// along with this library; if not, write to the Free Software Foundation, Inc.,
// 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA

(function () {

    let scriptName = "xhr_override.js";

    // Save reference to earlier defined object implementation (if any)
    let oXMLHttpRequest = window.XMLHttpRequest;

    // Define on browser type
    let bGecko = !!window.controllers,
        bIE = window.document.all && !window.opera,
        bIE7 = bIE && window.navigator.userAgent.match(/MSIE 7.0/);

    // Enables "XMLHttpRequest()" call next to "new XMLHttpReques()"
    function fXMLHttpRequest() {
        this._object = oXMLHttpRequest && !bIE7 ? new oXMLHttpRequest : new window.ActiveXObject("Microsoft.XMLHTTP");
        this._listeners = [];
    };

    // Constructor
    function cXMLHttpRequest() {
        return new fXMLHttpRequest;
    };
    cXMLHttpRequest.prototype = fXMLHttpRequest.prototype;

    // BUGFIX: Firefox with Firebug installed would break pages if not executed
    if (bGecko && oXMLHttpRequest.wrapped)
        cXMLHttpRequest.wrapped = oXMLHttpRequest.wrapped;

    // Constants
    cXMLHttpRequest.UNSENT = 0;
    cXMLHttpRequest.OPENED = 1;
    cXMLHttpRequest.HEADERS_RECEIVED = 2;
    cXMLHttpRequest.LOADING = 3;
    cXMLHttpRequest.DONE = 4;

    // Public Properties
    cXMLHttpRequest.prototype.readyState = cXMLHttpRequest.UNSENT;
    cXMLHttpRequest.prototype.responseText = '';
    cXMLHttpRequest.prototype.responseXML = null;
    cXMLHttpRequest.prototype.status = 0;
    cXMLHttpRequest.prototype.statusText = '';

    // Priority proposal
    cXMLHttpRequest.prototype.priority = "NORMAL";

    // Instance-level Events Handlers
    cXMLHttpRequest.prototype.onreadystatechange = null;

    // Class-level Events Handlers
    cXMLHttpRequest.onreadystatechange = null;
    cXMLHttpRequest.onopen = null;
    cXMLHttpRequest.onsend = null;
    cXMLHttpRequest.onabort = null;

    // Public Methods
    cXMLHttpRequest.prototype.open = function (sMethod, sUrl, bAsync, sUser, sPassword) {
        // Delete headers, required when object is reused
        delete this._headers;

        // Socket.io
        this._url = sUrl;
        if (sUrl && sUrl.indexOf && (sUrl.indexOf("/socket.io") >= 0) || (sUrl.indexOf("/engine.io") >= 0)) {
            let temp_url = sUrl.split('?');
            temp_url = (temp_url[0]) ? temp_url[0].split('/') : null;
            this._socket_session_id = temp_url.slice(-1)[0];
        }

        // When bAsync parameter value is omitted, use true as default
        if (arguments.length < 3)
            bAsync = true;

        // Save async parameter for fixing Gecko bug with missing readystatechange in synchronous requests
        this._async = bAsync;

        // Set the onreadystatechange handler
        let oRequest = this,
            nState = this.readyState,
            fOnUnload;

        // BUGFIX: IE - memory leak on page unload (inter-page leak)
        if (bIE && bAsync) {
            fOnUnload = function () {
                if (nState != cXMLHttpRequest.DONE) {
                    fCleanTransport(oRequest);
                    // Safe to abort here since onreadystatechange handler removed
                    oRequest.abort();
                }
            };
            window.attachEvent("onunload", fOnUnload);
        }

        // Add method sniffer
        if (cXMLHttpRequest.onopen)
            cXMLHttpRequest.onopen.apply(this, arguments);

        if (arguments.length > 4)
            this._object.open(sMethod, sUrl, bAsync, sUser, sPassword);
        else if (arguments.length > 3)
            this._object.open(sMethod, sUrl, bAsync, sUser);
        else
            this._object.open(sMethod, sUrl, bAsync);

        this.readyState = cXMLHttpRequest.OPENED;
        fReadyStateChange(this);

        this._object.onreadystatechange = function () {
            if (bGecko && !bAsync)
                return;

            // Synchronize state
            oRequest.readyState = oRequest._object.readyState;
            fSynchronizeValues(oRequest);

            // BUGFIX: Firefox fires unnecessary DONE when aborting
            if (oRequest._aborted) {
                // Reset readyState to UNSENT
                oRequest.readyState = cXMLHttpRequest.UNSENT;

                // Return now
                return;
            }

            if (oRequest.readyState == cXMLHttpRequest.DONE) {
                // Free up queue
                delete oRequest._data;
                fCleanTransport(oRequest);

                // BUGFIX: IE - memory leak in interrupted
                if (bIE && bAsync)
                    window.detachEvent("onunload", fOnUnload);
            }

            // BUGFIX: Some browsers (Internet Explorer, Gecko) fire OPEN readystate twice
            if (nState != oRequest.readyState)
                fReadyStateChange(oRequest);

            nState = oRequest.readyState;

            if (typeof (oRequest._url) == 'string' &&
                (oRequest._url.indexOf("/socket.io") >= 0) || (oRequest._url.indexOf("/engine.io") >= 0) && nState == 4) {
                let obj_ind = oRequest.responseText.indexOf('{');
                if (obj_ind > 0) {
                    let obj = oRequest.responseText.substring(obj_ind);
                    obj = JSON.parse(obj);

                    let socket_obj = {
                        event: 'socket_listen',
                        socket_id: oRequest._socket_session_id,
                        type: obj.name,
                        args: obj.args
                    }

                    document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
                        detail: socket_obj
                    }));
                }
            }
        }
    };

    function fXMLHttpRequest_send(oRequest) {
        oRequest._object.send(oRequest._data);

        if (bGecko && !oRequest._async) {
            oRequest.readyState = cXMLHttpRequest.OPENED;

            // Synchronize state
            fSynchronizeValues(oRequest);

            // Simulate missing states
            while (oRequest.readyState < cXMLHttpRequest.DONE) {
                oRequest.readyState++;
                fReadyStateChange(oRequest);
                // Check if we are aborted
                if (oRequest._aborted)
                    return;
            }
        }
    };

    cXMLHttpRequest.prototype.send = function (vData) {
        // Add method sniffer
        if (cXMLHttpRequest.onsend)
            cXMLHttpRequest.onsend.apply(this, arguments);

        if (!arguments.length)
            vData = null;

        if (vData && vData.nodeType) {
            vData = window.XMLSerializer ? new window.XMLSerializer().serializeToString(vData) : vData.xml;
            if (!this._headers["Content-Type"])
                this._object.setRequestHeader("Content-Type", "application/xml");
        }

        // Only echo if there was a post body
        // Socket.io
        if (vData && this && this._url && this._url.indexOf && (this._url.indexOf("/socket.io") >= 0) || (this._url.indexOf("/engine.io") >= 0)) {
            let obj = vData.substring(vData.indexOf('{'));
            obj = JSON.parse(obj);

            let socket_obj = {
                event: 'socket_emit',
                socket_id: this._socket_session_id,
                type: obj.name,
                args: obj.args
            }

            document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
                detail: socket_obj
            }));
        }

        this._data = vData;
        fXMLHttpRequest_send(this);
    };

    cXMLHttpRequest.prototype.abort = function () {
        // Add method sniffer
        if (cXMLHttpRequest.onabort)
            cXMLHttpRequest.onabort.apply(this, arguments);

        if (this.readyState > cXMLHttpRequest.UNSENT)
            this._aborted = true;

        this._object.abort();

        fCleanTransport(this);

        this.readyState = cXMLHttpRequest.UNSENT;

        delete this._data;
    };

    cXMLHttpRequest.prototype.getAllResponseHeaders = function () {
        return this._object.getAllResponseHeaders();
    };

    cXMLHttpRequest.prototype.getResponseHeader = function (sName) {
        return this._object.getResponseHeader(sName);
    };

    cXMLHttpRequest.prototype.setRequestHeader = function (sName, sValue) {
        if (!this._headers)
            this._headers = {};
        this._headers[sName] = sValue;

        return this._object.setRequestHeader(sName, sValue);
    };

    // EventTarget interface implementation
    cXMLHttpRequest.prototype.addEventListener = function (sName, fHandler, bUseCapture) {
        for (let nIndex = 0, oListener; oListener = this._listeners[nIndex]; nIndex++)
            if (oListener[0] == sName && oListener[1] == fHandler && oListener[2] == bUseCapture)
                return;
        // Add listener
        this._listeners.push([sName, fHandler, bUseCapture]);
    };

    cXMLHttpRequest.prototype.removeEventListener = function (sName, fHandler, bUseCapture) {
        for (let nIndex = 0, oListener; oListener = this._listeners[nIndex]; nIndex++)
            if (oListener[0] == sName && oListener[1] == fHandler && oListener[2] == bUseCapture)
                break;
        // Remove listener
        if (oListener)
            this._listeners.splice(nIndex, 1);
    };

    cXMLHttpRequest.prototype.dispatchEvent = function (oEvent) {
        let oEventPseudo = {
            'type': oEvent.type,
            'target': this,
            'currentTarget': this,
            'eventPhase': 2,
            'bubbles': oEvent.bubbles,
            'cancelable': oEvent.cancelable,
            'timeStamp': oEvent.timeStamp,
            'stopPropagation': function () {
            },  // There is no flow
            'preventDefault': function () {
            },  // There is no default action
            'initEvent': function () {
            }  // Original event object should be initialized
        };

        // Execute onreadystatechange
        if (oEventPseudo.type == "readystatechange" && this.onreadystatechange)
            (this.onreadystatechange.handleEvent || this.onreadystatechange).apply(this, [oEventPseudo]);

        // Execute listeners
        for (let nIndex = 0, oListener; oListener = this._listeners[nIndex]; nIndex++)
            if (oListener[0] == oEventPseudo.type && !oListener[2])
                (oListener[1].handleEvent || oListener[1]).apply(this, [oEventPseudo]);
    };

    cXMLHttpRequest.prototype.toString = function () {
        return '[' + "object" + ' ' + "XMLHttpRequest" + ']';
    };

    cXMLHttpRequest.toString = function () {
        return '[' + "XMLHttpRequest" + ']';
    };

    // Helper function
    function fReadyStateChange(oRequest) {
        // Sniffing code
        if (cXMLHttpRequest.onreadystatechange)
            cXMLHttpRequest.onreadystatechange.apply(oRequest);

        // Fake event
        oRequest.dispatchEvent({
            'type': "readystatechange",
            'bubbles': false,
            'cancelable': false,
            'timeStamp': new Date + 0
        });
    };

    function fGetDocument(oRequest) {
        let oDocument = oRequest.responseXML,
            sResponse = oRequest.responseText;
        // Try parsing responseText
        if (bIE && sResponse && oDocument && !oDocument.documentElement && oRequest.getResponseHeader("Content-Type").match(/[^\/]+\/[^\+]+\+xml/)) {
            oDocument = new window.ActiveXObject("Microsoft.XMLDOM");
            oDocument.async = false;
            oDocument.validateOnParse = false;
            oDocument.loadXML(sResponse);
        }
        // Check if there is no error in document
        if (oDocument)
            if ((bIE && oDocument.parseError != 0) || !oDocument.documentElement || (oDocument.documentElement && oDocument.documentElement.tagName == "parsererror"))
                return null;
        return oDocument;
    };

    function fSynchronizeValues(oRequest) {
        try {
            oRequest.responseText = oRequest._object.responseText;
        } catch (e) {
        }
        try {
            oRequest.responseXML = fGetDocument(oRequest._object);
        } catch (e) {
        }
        try {
            oRequest.status = oRequest._object.status;
        } catch (e) {
        }
        try {
            oRequest.statusText = oRequest._object.statusText;
        } catch (e) {
        }
    };

    function fCleanTransport(oRequest) {
        // BUGFIX: IE - memory leak (on-page leak)
        // oRequest._object.onreadystatechange = new window.Function;
        oRequest._object.onreadystatechange = null;
    };

    // Internet Explorer 5.0 (missing apply)
    if (!window.Function.prototype.apply) {
        window.Function.prototype.apply = function (oRequest, oArguments) {
            if (!oArguments)
                oArguments = [];
            oRequest.__func = this;
            oRequest.__func(oArguments[0], oArguments[1], oArguments[2], oArguments[3], oArguments[4]);
            delete oRequest.__func;
        };
    }
    ;

    let scriptId = -1;
    for (let i = 0; i < document.scripts.length; i++) {
        if (document.scripts[i].src.indexOf(scriptName) >= 0) {
            scriptId = i;
            break;
        }
    }
    if (scriptId >= 0 && document.scripts[scriptId].getAttribute("should-override-sockets") == "true") {
        window.XMLHttpRequest = cXMLHttpRequest;
    } else {
        window.XMLHttpRequest = oXMLHttpRequest;
    }

    // enable toggling between XHR versions
    document.addEventListener('Socket.io.StartMonitor', function (e) {
        window.XMLHttpRequest = cXMLHttpRequest;
    });
    document.addEventListener('Socket.io.StopMonitor', function (e) {
        window.XMLHttpRequest = oXMLHttpRequest;
    });
})();
