// This script is injected into any loaded page at the end of the document
// as specified in the manifest

var scripts = ["ws_override"];

for (var i = 0; i < scripts.length; i++) {
  // Inject the script
  var s = document.createElement("script");
  var sName = "script/" + scripts[i] + ".js";
  s.src = chrome.extension.getURL(sName);
  (document.head||document.documentElement).appendChild(s);

  s.onload = function() {
    if (s.parentNode && this) {
      s.parentNode.removeChild(this);
    }
  }
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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  /*alert(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension");
*/
  if (request.greeting == "unload_overrides") {
    document.dispatchEvent(new CustomEvent('Socket.io.SuspendXHR', {}));
    sendResponse({farewell: "overrides unloaded"})
  };
});
