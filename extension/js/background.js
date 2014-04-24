// Initial background page setup
var ports = [];
var uniq_id = 0;

// Set up communication channel with devtools
chrome.extension.onConnect.addListener(function (port) {
  // Add this new connection to list of ports
  var port_id = uniq_id;
  uniq_id++;

  // get the tab id from the port name
  if(port.name.indexOf('socket.io-') < 0) {
    return; // TODO print an error
  }

  // TODO this is a pretty fragile way of getting the tab id...
  var tab_id = parseInt(port.name.substring(port.name.indexOf('-')+1));

  // TODO this can become port[tab_id] = port again, if tab_id method is good
  ports[port_id] = {
    port: port,
    tab_id: tab_id
  };

  port.onDisconnect.addListener(function (message) {
    console.log('disconnected + removed listener');

    // unload overrides
    chrome.tabs.query({}, function(tabs) {
      chrome.tabs.sendMessage(tab_id, {event: "unload_overrides"}, function(response) {
        console.log(response.farewell);
      });
    });
    delete ports[port_id];
  });
});

// Listen for messages
chrome.extension.onMessage.addListener(function(req, sender, res) {
  switch (req.type) {
    case 'bglog':
      console.log(req.obj);
      break;
    case 'socket_listen':
      for (port_id in ports && ports[port_id].port) {
        if (ports[port_id]) {
          ports[port_id].port.postMessage(req.obj);
        }
      }
      break;
    case 'socket_emit':
      for (port_id in ports) {
        if (ports[port_id] && ports[port_id].port) {
          ports[port_id].port.postMessage(req.obj);
        }
      }
      break;
    case 'tab.register':
      res({ tab_id: sender.tab.id });
      break;
  }
});

// Listen for url updates / refreshes
// TODO with new method of getting tabs, we can send fewer of these messages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  var obj = {
    event: 'tab_change',
    tab_id: tabId
  };

  for (port_id in ports) {
    if (ports[port_id] && ports[port_id].port) {
      ports[port_id].port.postMessage(obj);
    }
  }
});
