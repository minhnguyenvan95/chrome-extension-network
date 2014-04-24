// Initial background page setup
var ports = [];
var uniq_id = 0;

// Set up communication channel with devtools
chrome.extension.onConnect.addListener(function (port) {
  // Add this new connection to list of ports
  var port_id = uniq_id;
  uniq_id++;
  ports[port_id] = port;

  port.onDisconnect.addListener(function (message) {
    console.log('disconnected + removed listener');
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
      for (port_id in ports) {
        if (ports[port_id]) {
          ports[port_id].postMessage(req.obj);
        }
      }
      break;
    case 'socket_emit':
      for (port_id in ports) {
        if (ports[port_id]) {
          ports[port_id].postMessage(req.obj);
        }
      }
      break;
    case 'tab.register':
      res({ tab_id: sender.tab.id });
      break;
  }
});

// Listen for url updates / refreshes
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  var obj = {
    event: 'tab_change',
    tab_id: tabId
  };

  for (port_id in ports) {
    if (ports[port_id]) {
      ports[port_id].postMessage(obj);
    }
  }
});
