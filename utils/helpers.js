// moment.js is a handy library for displaying dates. We need this in our templates to display things like "Posted 5 minutes ago"
exports.moment = require ('moment');

// Dump is a handy debugging function we can use to sort of "console.log" our data
exports.dump = obj => JSON.stringify (obj, null, 2);

// Some details about the site
exports.siteName = `Github Properties editor`;

exports.isInArray = (arr, item) => {
  return arr.indexOf (item) >= 0;
};

exports.isInObject = (obj, key) => {
  return key in obj;
};

exports.findKeyIntoArrayObject = (arrObj, key) => {
  return arrObj.some (o => {
    return this.isInArray (o.keys, key);
  });
};
