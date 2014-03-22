// util function
var bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}

bglog('--- starting panel.js scripts ---');

// Create a connection to the background page
var port = chrome.extension.connect({
  name: "socket.io-devtools-panel"
});

// Handle response from background page
// Should add a visible element representing socket data to the devtool panel
port.onMessage.addListener(function (msg) {
  var new_el = document.createElement('p');
  var info_div = document.getElementById('info');
  var socket_info = msg;

  if (socket_info) {
    var plaintext = '['+socket_info.socket_id+']['+
                        socket_info.type+'] ';
    for (arg in socket_info.args) {
      plaintext = plaintext + socket_info.args[arg] + ' ';
    }

    new_el.innerHTML = plaintext;
    info_div.appendChild(new_el);
  };
});
