// This script is injected into any loaded page at the end of the document
// as specified in the manifest

// Inject the script
var s = document.createElement("script");
s.src = chrome.extension.getURL('script/script.js');
(document.head||document.documentElement).appendChild(s);

s.onload = function() {
  s.parentNode.removeChild(s);
}

// Get curent tab id
var tab_id;
chrome.extension.sendMessage({ type: 'tab.register' }, function (res) {
    tab_id = res.tab_id;
}.bind(this));

// Listen for socket events from the injected script
// requires tab to be registered
document.addEventListener('Socket.io.SocketEvent', function(e) {
  e.detail.tab_id = tab_id;

  e.detail.timestamp = e.timestamp;

  chrome.extension.sendMessage({
    type: e.detail.event,
    obj: e.detail,
  });
}.bind(this));
