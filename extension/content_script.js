// This script is injected into any loaded page at the end of the document
// as specified in the manifest

/*
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
// chrome.extension.sendMessage({type: "echo", count: 0});
*/

// Inject the script
var s = document.createElement("script");
s.src = chrome.extension.getURL('script/script.js');
(document.head||document.documentElement).appendChild(s);

s.onload = function() {
  s.parentNode.removeChild(s);
}

// Listen for socket events from the injected script
document.addEventListener('Socket.io.SocketEvent', function(e) {
  console.log(e.detail);
  chrome.extension.sendMessage({type: "socket_event", obj: e.detail});
});


// experiment
chrome.extension.onMessage.addListener(function (message, sender) {
  console.log("In CS, message is: "+message);
  // send info to background
  chrome.extension.sendMessage(' my url is: '+window.location.origin);
});
