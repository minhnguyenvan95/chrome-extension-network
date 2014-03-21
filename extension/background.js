// Set up communication channel with devtools
chrome.extension.onConnect.addListener(function (port) {
  port.postMessage('[B->D] PONG');
  console.log('port connected: '+port.name);

  var listener = function(message, sender, sendResponse) {
    switch(message.type) {
      case "bglog":
        console.log(message.obj);
        break;
      case "socket_event":
        console.log(message.obj);
        if (port) {
          port.postMessage(message.obj);
        }
        break;
    }
  };

  // Handle messages from content scripts
  chrome.extension.onMessage.addListener(listener);

  // Handle messages from devtools
  port.onMessage.addListener(function (message) {
    console.log('[D->B] '+message);
  });

  port.onDisconnect.addListener(function (message) {
    console.log('disconnected + removed listener');
    port = null;
    chrome.extension.onMessage.removeListener(listener);
  });

});
