let sockets = {};
let visible = null;

// util function
let bglog = function(obj) {
  if (chrome && chrome.runtime) {
    chrome.runtime.sendMessage({type: "bglog", obj: obj});
  }
}

$.fn.scrollBottom = function() { 
  return $(document).height() - this.scrollTop() - this.height(); 
};

$("#clearButton").click(function(e){
  let table = sockets[$("#clearButton").data("socket")].pane2Table;
  let tableRows = table.getElementsByTagName('tr');
  let rowCount = tableRows.length;

  for (let x=rowCount-1; x>0; x--) {
    table.removeChild(tableRows[x]);
  }

  //add back info
  let info = document.createElement("h4");
  info.setAttribute("id", "Pane-2-Info");
  info.innerText = "No data available";
  pane2.appendChild(info);
});

$("#recordButton")
  .click(function(e) {
    let label = document.getElementById("recordStatus");
    if (e.target.className.indexOf("off") >= 0) {
      e.target.className = "recordButton on";
      label.innerText = "Recording";
      chrome.runtime.sendMessage({type: "monitor_on", obj: {tab: chrome.devtools.inspectedWindow.tabId}});
    } else {
      e.target.className = "recordButton off";
      label.innerText = "";
      chrome.runtime.sendMessage({type: "monitor_off", obj: {tab: chrome.devtools.inspectedWindow.tabId}});
    }
    label.oldText = label.innerText;
  })
  .hover(function(e) {
    e.target.className += " hover";
    let label = document.getElementById("recordStatus");
    label.oldText = label.innerText;

    if (e.target.className.indexOf("off") >= 0) {
      label.innerText = "Start Recording";
    } else {
      label.innerText = "Stop Recording";
    }
  }, function(e) {
    e.target.className = e.target.className.replace(" hover", "");
    let label = document.getElementById("recordStatus");
    label.innerText = label.oldText;
  });

$("#opener").click(function(e){
    let panel = $('#slide-panel');
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
let port = chrome.extension.connect({
  name: 'socket.io-'+chrome.devtools.inspectedWindow.tabId
});


// Handle response from background page
// Should add a visible element representing socket data to the devtool panel
port.onMessage.addListener(function (msg) {

  let pane1 = document.getElementById("socketList");
  let pane2 = document.getElementById("Pane-2-TableArea");

  // check for malformed message
  if (msg == undefined || msg == null) {
    return;
  }

  // check for message corresponding to other browser tabs
  if (msg.tab_id != chrome.devtools.inspectedWindow.tabId) {
    return;
  }

  // check if monitoring is "off" but messages are still coming in over WS
  if (document.getElementById("recordButton").className.indexOf("off") >= 0) {
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
    // add back the info
    let info = document.createElement("h4");
    info.setAttribute("id", "Pane-2-Info");
    info.innerText = "No data available";
    pane2.appendChild(info);
  }

  if (msg.event == "socket_emit" || msg.event == "socket_listen") {
    //remove info messages if sockets are added
    $("#Pane-1-Info").remove();

    // create new message list on a new socket id
    if (sockets[msg.socket_id] == undefined) {

      //remove info message if data added
      $("#Pane-2-Info").remove();
      let socketLi = document.createElement("li")
      let a = document.createElement("a");

      // Make the socket name more user friendly
      a.innerText = "Socket " + msg.socket_id.substring(msg.socket_id.length-3);
      a.setAttribute('data-socket-id', msg.socket_id);

      socketLi.addEventListener("click", function(e) {
        // change messages displayed in center panel
        let clicked = e.target.getAttribute('data-socket-id');
        if (clicked && (visible !== clicked)) {
          sockets[visible].pane2Table.style.display = "none";
          sockets[visible].socketLi.className = ".disabled";
          sockets[clicked].pane2Table.style.display = "block";
          sockets[clicked].socketLi.className = "active";
          $("#clearButton").data("socket", clicked);
          visible = clicked;
        }
      });

      socketLi.appendChild(a);
      pane1.appendChild(socketLi);

      let pane2Table = document.createElement("table");
      pane2Table.className = "table";
      pane2Table.setAttribute("id", "dataTable");
      let header_row = document.createElement('tr');
      header_row.innerHTML = '<td>direction</td>'+
                             '<td>type</td>'+
                             '<td>url</td>' +
                             '<td>arguments</td>';
      pane2Table.appendChild(header_row);

      //add to sockets list
      sockets[msg.socket_id] = {
        pane2Table : pane2Table,
        socketLi : socketLi,
        messages : []
      };
    }

    if (visible == null) {
        visible = msg.socket_id;
        socketLi.className = "active";
      } else {
        //switch to new tab
        sockets[visible].pane2Table.style.display = "none";
        sockets[visible].socketLi.className = ".disabled";
        sockets[msg.socket_id].pane2Table.style.display = "block";
        sockets[msg.socket_id].socketLi.className = "active";
        $("#clearButton").data("socket", msg.socket_id);
        visible = msg.socket_id;
      }

    // create new row upon receiving message
    let pane2Table = sockets[msg.socket_id].pane2Table;

    //init delete button
    $("#clearButton").data("socket", msg.socket_id);
    let tr = document.createElement("tr");

    // create direction cell
    let td_dir = document.createElement("td");
    td_dir.innerHTML = (msg.event == "socket_listen") ? "inbound" : "outbound";

    // create type cell
    let td_type = document.createElement("td");
    td_type.innerHTML = msg.type;

    // create url cell
    let td_url = document.createElement("td");
    td_url.innerHTML = msg.url;

    // create args cell
    let td_args = document.createElement("td");
    let args_string = '';
    let argc = 0;
    for (let arg in msg.args) {
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
    tr.appendChild(td_url);
    tr.appendChild(td_args);

    // Append the row / table
    pane2Table.appendChild(tr);
    pane2.appendChild(pane2Table);

    // keep track of the message in the socket object
    sockets[msg.socket_id].messages.push(msg);

    $('#Pane-2').stop().animate({ scrollTop: $("#Pane-2")[0].scrollHeight }, 500);
  }
});
