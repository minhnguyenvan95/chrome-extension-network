// Initial background page setup
let ports = [];
let shouldOverride = [];
let uniq_id = 0;

// Set up communication channel with devtools
chrome.extension.onConnect.addListener(function (port) {
  // Add this new connection to list of ports
  let port_id = uniq_id;
  uniq_id++;

  // get the tab id from the port name
  if(port.name.indexOf('socket.io-') < 0) {
    return; // TODO print an error
  }

  // TODO this is a pretty fragile way of getting the tab id...
  let tab_id = parseInt(port.name.substring(port.name.indexOf('-')+1));

  // TODO this can become port[tab_id] = port again, if tab_id method is good
  ports[port_id] = {
    port: port,
    tab_id: tab_id
  };

  if (shouldOverride[tab_id] == undefined) {
    shouldOverride[tab_id] = false;
  }

  port.onDisconnect.addListener(function (message) {
    // unload overrides
    chrome.tabs.sendMessage(tab_id, {type: 'stop-monitor'}, function(response) {});
    delete ports[port_id];
  });
});

// Listen for messages
chrome.extension.onMessage.addListener(function(req, sender, res) {
  console.log(req);
  switch (req.type) {
    case 'bglog':
      console.log(req.obj);
      break;
    case 'socket_listen':
      for (port_id in ports) {
        if (ports[port_id] && ports[port_id].port) {
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
    case 'monitor_off':
      console.log("monitoring disabled for tab " + req.obj.tab);
      chrome.tabs.sendMessage(req.obj.tab, {type: 'monitor_off'});
      shouldOverride[req.obj.tab] = false;
      break;
    case 'monitor_on':
      console.log("monitoring enabled for tab " + req.obj.tab);
      chrome.tabs.sendMessage(req.obj.tab, {type: 'monitor_on'});
      shouldOverride[req.obj.tab] = true;
      break;
    case 'tab.register':
      res({ tab_id: sender.tab.id, should_override: shouldOverride[sender.tab.id] });
      break;
  }
});

// Listen for url updates / refreshes
// TODO with new method of getting tabs, we can send fewer of these messages
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  let obj = {
    event: 'tab_change',
    tab_id: tabId
  };

  for (port_id in ports) {
    if (ports[port_id] && ports[port_id].port) {
      ports[port_id].port.postMessage(obj);
    }
  }
});
