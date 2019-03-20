window.onload = function () {
  var socket = io.connect();
  var nickname;

  socket.on('connect', function () {
    // Get user nickname
    nickname = prompt('What is your nickname?');
    socket.emit('join', nickname);

    // show the chat
    document.getElementById('chat').style.display = 'block';
  });

  socket.on('announcement', function (msg) {
    var li = document.createElement('li');
    li.className = 'announcement';
    li.innerHTML = msg;
    document.getElementById('messages').appendChild(li);
  });

  socket.on('text', addMessage);
  socket.on('numbers', addMessage);
  socket.on('object', addMessage);

  function addMessage (from) {
    var args = Array.prototype.slice.call(arguments);
    var messages = args.slice(1);
    console.log(messages);

    var li = document.createElement('li');
    li.className = 'message';
    var inner = '<b>' + from + '</b>: ';

    for (msg in messages) {
      inner = inner + ' ' + messages[msg];
    }

    li.innerHTML = inner;

    document.getElementById('messages').appendChild(li);
    return li;
  }

  var input = document.getElementById('input');
  document.getElementById('form').onsubmit = function () {

    // Visually add message from self
    console.log(input.value);
    var li = addMessage('me', input.value);

    // determine the type of chat message from the first word
    var message = input.value.split(' ');
    switch (message[0]) {
      // Tests variable number of arguments + callback fn
      case 'numbers':
        socket.emit('numbers', 0, 1, 2, function (date) {
        li.className = 'confirmed';
        li.title = date;
        });
        break;
      // Tests objects + nested objects
      case 'object':
        socket.emit('object', 'test_1', undefined, {
          a: 'test_2',
          b: 42,
          c: {d: 'test_3'}
        });
        break;
      default:  // text
        socket.emit('text', input.value, function (date) {
          li.className = 'confirmed';
          li.title = date;
        });
        break;
    }

    // reset the input
    input.value = '';
    input.focus();

    return false;
  }
}
