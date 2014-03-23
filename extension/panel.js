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

  // check for malformed message
  if (msg == undefined || msg == null) {
    return;
  }

  // check for message corresponding to other browser tabs
  if (msg.tab_id != chrome.devtools.inspectedWindow.tabId) {
    return;
  }

  // create new message list on a new socket id
  if (sockets[msg.socket_id] == undefined) {
    var leftLI = document.createElement("li");
    leftLI.class = "socketListElement";
    leftcol.appendChild(leftLI);
    leftLI.innerText = msg.socket_id;
    leftLI.addEventListener("click", function(e) {
      // change messages displayed in center panel
      var clicked = e.target.innerText;
      sockets[visible].centerUL.style.display = "none";
      sockets[clicked].centerUL.style.display = "block";
    })

    var centerUL = document.createElement("ul");
    centerUL.class = "messageList";
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
  li.class = "messageListElement";

  // socket's msg.type is displayed in its own css class: socket_msg_type
  var plaintext = '<span class="socket_msg_type">' + msg.type + '</span> {';
  if (args.length > 0) {
    plaintext += ' ';
    for (var arg in msg.args) {
      plaintext += arg + ' : ' + msg.args[arg] + ', ';
    }
    plaintext = plaintext.substring(0, plaintext.length-2);
  }
  plaintext += ' }';

  li.innerHTML = plaintext;

  centerUL.appendChild(li);
});
