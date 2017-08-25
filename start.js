const {executeCommand} = require ('./utils/util-functions');
const {join} = require ('path');
// import environmental variables from our variables.env file
require ('dotenv').config ({path: 'variables.env'});
let users = 0;

// Start our app!
const {app, server, io} = require ('./app');
app.set ('port', process.env.PORT || 7777);

server.listen (app.get ('port'), () => {
  console.log (`Express running → PORT ${server.address ().port}`);
});

io.on ('connection', socket => {
  users++;
  socket.on ('disconnect', async () => {
    //await executeCommand (`rm -rf ${join (__dirname, '.tmp')}`);
    users--;
  });
});
