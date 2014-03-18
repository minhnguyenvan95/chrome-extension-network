// this javascript will be injected into every page you load
// (or really, any page that matches the regular expression in manifest.json)

// therefore, you can (hopefully) use this to capture socket.io information,
// send a copy to the extension, then send it on its way

var maxEcho = 8;

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("got message " + message.count);
  if (message.count < maxEcho) {
    chrome.extension.sendMessage({type: "echo", count: message.count + 1});
  }
  // if we call sendResponse(response) here, it will be picked up by
  // function(response) in background.js
});

// base case
chrome.extension.sendMessage({type: "echo", count: 0});

setTimeout(10, function(){
  console.log('eh');
  if (window.socket) {
    console.log('debug socket found!');
  } else {
    console.log('debug socket not found');
  }
});
