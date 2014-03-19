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
// chrome.extension.sendMessage({type: "echo", count: 0});

/*$(window).load(function() {
  console.log('load');
  console.log(window.socket);
});*/

var s = document.createElement("script");
s.src = chrome.extension.getURL('script/script.js');
(document.head||document.documentElement).appendChild(s);

s.onload = function() {
  s.parentNode.removeChild(s);
}

document.addEventListener('E123', function(e) {
  console.log(e.detail);
  chrome.extension.sendMessage({type: "socket.io", detail: e.detail});
});
