// This script is injected into any loaded page at the end of the document
// as specified in the manifest

var scripts = ["ws_override","xhr_override"];

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
  console.log('my tab id: '+tab_id);
}.bind(this));

// Listen for socket events from the injected script
// requires tab to be registered
document.addEventListener('Socket.io.SocketEvent', function(e) {
  e.detail.tab_id = tab_id;
  e.detail.timestamp = e.timestamp;

  console.log(e.detail);

  chrome.extension.sendMessage({
    type: e.detail.event,
    obj: e.detail,
  });
}.bind(this));


chrome.runtime.onMessage.addListener(
  function(req, sender, res) {
    console.log(req.type);

    switch(req.type) {
      case('monitor_off'):
        document.dispatchEvent(new CustomEvent('Socket.io.StopMonitor', {}));
        break;
      case('monitor_on'):
        document.dispatchEvent(new CustomEvent('Socket.io.StartMonitor', {}));
        break;
    }

    res({farewell: "goodbye"});
});

