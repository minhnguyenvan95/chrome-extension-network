// util function
var bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}

$("#opener").click(function(e){
    var panel = $('#slide-panel');
    if (panel.hasClass("visible")) {
      panel.removeClass('visible').animate({
        'right': '-300px'
      });
      $("#opener-symbol").attr("class", "glyphicon glyphicon-backward");
     } 
     else {
      panel.addClass('visible').animate({
        'right': '0'
      });
      $("#opener-symbol").attr("class", "glyphicon glyphicon-forward");
     }
     return false;
});

//init resizing extension and panel
$(document).ready(function(){
  newWidth = $(window).width() - 275;
  $("#Pane-2").css('width', newWidth);
  $("#opener").css('height', $(window).height());
  $("#opener").css('padding-top', $(window).height()/2);
});

//set up page resize
$(window).resize(function(){
  newWidth = $(window).width() - 275;
  $("#Pane-2").css('width', newWidth);
  $("#opener").css('height', $(window).height());
  $("#opener").css('padding-top', $(window).height()/2);
});

// Create a connection to the background page
var port = chrome.extension.connect({
  name: 'socket.io-'+chrome.devtools.inspectedWindow.tabId
});

var sockets = {};
var visible = null;

// Handle response from background page
// Should add a visible element representing socket data to the devtool panel
port.onMessage.addListener(function (msg) {
  var pane1 = document.getElementById("socketList");
  var pane2 = document.getElementById("Pane-2");

  // check for malformed message
  if (msg == undefined || msg == null) {
    return;
  }

  // check for message corresponding to other browser tabs
  if (msg.tab_id != chrome.devtools.inspectedWindow.tabId) {
    return;
  }

  if (msg.event == "tab_change") {
    sockets = {};
    visible = null;

    // Clear child nodes of each pane
    // Apparently, removing these one by one is more performant
    // than clearing innerHTML
    while (pane1.firstChild) {
      pane1.removeChild(pane1.firstChild);
    }
    while (pane2.firstChild) {
      pane2.removeChild(pane2.firstChild);
    }
  }

  if (msg.event == "socket_emit" || msg.event == "socket_listen") {
    // create new message list on a new socket id
    if (sockets[msg.socket_id] == undefined) {
      var socketLi = document.createElement("li")
      var a = document.createElement("a");
      a.innerText = msg.socket_id;

      socketLi.addEventListener("click", function(e) {
        // change messages displayed in center panel
        var clicked = e.target.innerText;
        sockets[visible].pane2Table.style.display = "none";
        sockets[visible].socketLi.className = "";
        sockets[clicked].pane2Table.style.display = "block";
        sockets[clicked].socketLi.className = "active";
        visible = clicked;
      });

      socketLi.appendChild(a);
      pane1.appendChild(socketLi);

      var pane2Table = document.createElement("table");
      pane2Table.className = "table";
      var header_row = document.createElement('tr');
      header_row.innerHTML = '<td>direction</td>'+
                             '<td>type</td>'+
                             '<td>arguments</td>';
      pane2Table.appendChild(header_row);

      if (visible == null) {
        visible = msg.socket_id;
        socketLi.className = "active";
      } else {
        pane2Table.style.display = "none";
      }

      //add to sockets list
      sockets[msg.socket_id] = {
        pane2Table : pane2Table,
        socketLi : socketLi,
        messages : []
      };
    }

    // create new row upon receiving message
    var pane2Table = sockets[msg.socket_id].pane2Table;
    var tr = document.createElement("tr");

    // create direction cell
    var td_dir = document.createElement("td");
    td_dir.innerHTML = (msg.event == "socket_listen") ? "inbound" : "outbound";

    // create type cell
    var td_type = document.createElement("td");
    td_type.innerHTML = msg.type;

    // create args cell
    var td_args = document.createElement("td");
    var args_string = '';
    var argc = 0;
    for (var arg in msg.args) {
      args_string += JSON.stringify(msg.args[arg]) + ', ';
      argc++
    }
    if (argc != 0) {
      args_string = args_string.substring(0, args_string.length-2);
    }
    td_args.innerHTML = args_string;

    // Create entire row
    tr.appendChild(td_dir);
    tr.appendChild(td_type);
    tr.appendChild(td_args);

    // Append the row / table
    pane2Table.appendChild(tr);
    pane2.appendChild(pane2Table);

    // keep track of the message in the socket object
    sockets[msg.socket_id].messages.push(msg);
  }
});
