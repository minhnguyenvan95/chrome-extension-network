// console.log in bg
let bglog = function (obj) {
    if (chrome && chrome.runtime) {
        chrome.runtime.sendMessage({type: "bglog", obj: obj});
    }
}

chrome.devtools.panels.create(
    "Socket.io",
    null,
    "panel.html",
    function (panel) {
        bglog('Socket.io panel created');
    });
