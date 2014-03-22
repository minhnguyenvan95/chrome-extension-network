// This script is injected into any loaded page at the end of the document
// as specified in the manifest

// Inject the script
var s = document.createElement("script");
s.src = chrome.extension.getURL('script/script.js');
(document.head||document.documentElement).appendChild(s);

s.onload = function() {
  s.parentNode.removeChild(s);
}

// Listen for socket events from the injected script
document.addEventListener('Socket.io.SocketEvent', function(e) {
  console.log('message from ' + e.detail.socket_id);
  console.log(e.detail);

  chrome.extension.sendMessage({
    type: e.detail.event,
    socket_id: e.detail.socket_id,
    obj: e.detail
  });
});
