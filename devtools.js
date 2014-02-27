// console.log in bg
var bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}

chrome.devtools.panels.create(
    "woop woop",
    null,
    "panel.html",
    function(panel){
      bglog('oh hi!');
});
