// util function
var bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}

// Create a connection to the background page
var port = chrome.extension.connect({
  name: "socket.io-devtools-panel"
});

var sockets = {};
var visible = null;

// Handle response from background page
// Should add a visible element representing socket data to the devtool panel
port.onMessage.addListener(function (msg) {
  var leftcol = document.getElementById("leftlist");
  var centerdiv = document.getElementById("contentcolumn").getElementsByClassName("innertube")[0];

  if (msg == undefined || msg == null || msg.tab_id != chrome.devtools.inspectedWindow.tabId) {
    return;
  }

  if (sockets[msg.socket_id] == undefined) {
    var leftLI = document.createElement("li");
    leftcol.appendChild(leftLI);
    leftLI.innerText = msg.socket_id;
    leftLI.addEventListener("click", function(e) {
      var clicked = e.target.innerText;
      sockets[visible].centerUL.style.display = "none";
      sockets[clicked].centerUL.style.display = "block";
    })

    var centerUL = document.createElement("ul");
    if (visible == null) {
      visible = msg.socket_id;
    } else if (visible != msg.socket_id) {
      centerUL.style.display = "none";
    }
    centerdiv.appendChild(centerUL);

    sockets[msg.socket_id] = { 
      centerUL : centerUL
    };
  }

  var centerUL = sockets[msg.socket_id].centerUL;
  var li = document.createElement("li");
  var plaintext = '<span class="socket_msg_type">' + msg.type + ':</span> { ';
  for (var arg in msg.args) {
    plaintext += arg + ' : ' + msg.args[arg] + ', ';
  }
  plaintext = plaintext.substring(0, plaintext.length-2);
  plaintext += ' }';

  li.innerHTML = plaintext;

  centerUL.appendChild(li);
});
