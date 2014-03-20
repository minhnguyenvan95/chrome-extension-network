var onMessageListener = function(message, sender, sendResponse) {
  switch(message.type) {
    case "bglog":
      console.log(message.obj);
      break;

    // a little "hello world" to show the page's javascript interacting
    // with the extension's javascript
    case "echo":
      // we need to ask chrome what windows are open first
      console.log("got message " + message.count);
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {type: "echo", count: message.count + 1},
          function(response) {}
        );
      });
      break;

    case "socket_event":
      console.log(message.obj);
      break;
  }
  return true;
}

chrome.runtime.onMessage.addListener(onMessageListener);
