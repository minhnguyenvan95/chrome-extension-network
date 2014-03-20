// Set up communication channel with devtools
chrome.extension.onConnect.addListener(function (port) {
  port.postMessage('[B->D] PONG');

  // Handle messages from devtools
  port.onMessage.addListener(function (message) {
    console.log('[D->B] '+message);
  });

  // Handle messages from content scripts
  chrome.extension.onMessage.addListener(
    function(message, sender, sendResponse) {
      switch(message.type) {
        case "bglog":
          console.log(message.obj);
          break;
        case "socket_event":
          console.log(message.obj);
          port.postMessage(message.obj);
          break;
      }
      return true;
  });
});

/*chrome.tabs.query({
  "status": "complete",
  "currentWindow": true,
  "url": "http://www.google.co.in/"
}, function (tabs) {
  for (tab in tabs) {
    // send message to content scripts
    chrome.tabs.sendMessage(tabs[tab].id, message);
  }
});*/
