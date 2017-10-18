const {executeCommand} = require ('./utils/util-functions');
const {join} = require ('path');
const {TMP_PREFIX} = require('./utils/constants');

let users = 0;
// import environmental variables from our variables.env file
require ('dotenv').config ({path: 'enviroment.env'});

// Start our app!
const {app, server, io} = require ('./app');
app.set ('port', process.env.PORT || 7777);

io.on('connection', function(socket) {
  const url = socket.handshake.headers.referer || '';
  const userID = Date.now();

  if (url.indexOf('login') < 0) {
    users++;
    io.emit('users', users, userID);
    socket.on('disconnect', function() {
      users--;
      io.emit('users', users, userID);
    });
  }
  
});

server.listen (app.get ('port'), () => {
  console.log (`Express running → PORT ${server.address ().port}`);

  if (process.send) {
    process.send('online');
  }
});