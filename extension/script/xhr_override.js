// XHR stuff
var xmlreqc = XMLHttpRequest;
XMLHttpRequest = function() {
  this.xhr = new xmlreqc();
  return this;
}

XMLHttpRequest.prototype.open = function (method, url, async, user, password)
{
  this.url = url;
  var temp_url = url.split('?');
  temp_url = (temp_url[0]) ? temp_url[0].split('/') : null;
  this.session_id = temp_url.slice(-1)[0];
  return this.xhr.open(method, url, async, user, password);
};

XMLHttpRequest.prototype.setRequestHeader = function(header, value)
{
  this.requestHeader = {header: header, value: value};
  this.xhr.setRequestHeader(header, value);
};

XMLHttpRequest.prototype.send = function(postBody)
{
  // only echo to the extension if there is a post body
  if (postBody) {
    var obj = postBody.substring(postBody.indexOf('{'));
    obj = JSON.parse(obj);

    var socket_obj = {
      event: 'socket_emit',
      socket_id: this.session_id,
      type: obj.name,
      args: obj.args
    }

    document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
      detail: socket_obj
    }));
  }

  var myXHR = this;

  this.xhr.onreadystatechange = function(){myXHR.onreadystatechangefunction();};
  this.xhr.send(postBody);
};

XMLHttpRequest.prototype.onreadystatechangefunction = function()
{
  if (this.xhr.readyState == 4) {
  }

  try{
    this.readyState = this.xhr.readyState;
    this.responseText = this.xhr.responseText;
    this.responseXML = this.xhr.responseXML;
    this.status = this.xhr.status;
    this.statusText = this.xhr.statusText;

    // wait until response received to try to post events
    if (this.readyState == 4) {
      var obj_ind = this.responseText.indexOf('{');
      if (obj_ind > 0) {
        var obj = this.responseText.substring(obj_ind);
        obj = JSON.parse(obj);

        var socket_obj = {
          event: 'socket_listen',
          socket_id: this.session_id,
          type: obj.name,
          args: obj.args
        }

        document.dispatchEvent(new CustomEvent('Socket.io.SocketEvent', {
          detail: socket_obj
        }));
      }
    }
  } catch(e){}
  this.onreadystatechange();
};
