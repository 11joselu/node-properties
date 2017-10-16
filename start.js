const {executeCommand} = require ('./utils/util-functions');
const {join} = require ('path');
const {TMP_PREFIX} = require('./utils/constants');

// import environmental variables from our variables.env file
require ('dotenv').config ({path: 'enviroment.env'});
let users = 0;

// Start our app!
const {app, server} = require ('./app');
app.set ('port', process.env.PORT || 7777);

server.listen (app.get ('port'), () => {
  console.log (`Express running → PORT ${server.address ().port}`);
});