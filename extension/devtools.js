// console.log in bg
var bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}

chrome.devtools.panels.create(
    "Socket.io",
    null,
    "panel.html",
    function(panel){
      bglog('Socket.io panel created');
      chrome.devtools.network.onRequestFinished.addListener(
        function(request){
          bglog(request.request.url);
      });
     //bglog(chrome.devtools.panels);
});
