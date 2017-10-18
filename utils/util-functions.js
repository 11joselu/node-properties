const child_process = require ('child-process-promise');
const exec = child_process.exec;
const spawn = child_process.spawn;
const fs = require ('fs');
const promisify = require ('es6-promisify');
const {emitEvent} = require ('../handlers/ioHandlers');
const {FILE_EXTENSION} = require('./constants');

/**
 * Execute a sync command
 */
exports.executeCommand = async (command, opts = {}) => {
  const {stdout, stderr} = await exec (command, opts);
  return {
    stdout,
    stderr,
  };
};


/**
 * Parse properties file into Object {key: value}
 */
exports.readPropertiesFiles = path => {
  return this.dotenvParse (fs.readFileSync (path, 'utf8'));
};

exports.readDir = path => {
  return fs.readdirSync (path);
};

exports.isFile = path => {
  return !fs.lstatSync (path).isDirectory ();
};

exports.getPropertiesFromDirectory = async filesDir => {
  return await this.readDir (filesDir).filter (x => {
    const file = x.split ('.');
    return file[file.length - 1] === FILE_EXTENSION;
  });
};

exports.getContentFromFile = filePath => {
  if (this.isFile (filePath)) {
    return this.readPropertiesFiles (filePath);
  }

  return null;
};

exports.uniq = arr => {
  return Array.from (new Set (arr));
};

exports.writeInFile = (file, content) => {
  fs.writeFile (file, content);
};

/**
 * Execute and emit git tasks
 *  return response task
 */
exports.executeGitTask = async (
  req,
  res,
  output_path,
  command,
  message = ''
) => {
  let commandResult = {};
  emitEvent (req, res, `cmd task`, message || command);
  // Execute task and wait for a response
  commandResult = await this.executeCommand (command, {cwd: output_path});
  // Emit response
  emitEvent (
    req,
    res,
    `cmd message`,
    commandResult.stderr || commandResult.stdout
  );

  return commandResult;
};

exports.getWorkingPath = (path, tmpFolder) => {
  return path.substring (path.indexOf (tmpFolder));
};

exports.errorResponse = (
  req,
  res,
  message = `Worker found an error. Contact to the administrator`,
  err
) => {
  emitEvent (req, res, `cmd error`, message);

  if (process.env.NODE_ENV === 'development') {
    console.log(err);
    err.message = err.message || message;
  } else {
    err.message = message || 'Ops!. Something went wrong';
  }


  res.status (500);
  return res.json ({
    status: 500,
    data: [],
    message: err.message
  });
};

exports.successResponse = (req, res, message, data = []) => {
  emitEvent (req, res, `cmd end`, message);

  res.json ({
    status: 200,
    data: data,
    message: 'Success',
  });
};

exports.dotenvParse =  (src) => {
  var obj = {}

  // convert Buffers before splitting into lines and processing
  src.toString().split('\n').forEach(function (line) {
    // matching "KEY' and 'VAL' in 'KEY=VAL'
    var keyValueArr = line.match(/^\s*([\w\.\-\%\(\)]+)\s*=\s*(.*)?\s*$/)
    // matched?
    if (keyValueArr != null) {
      var key = keyValueArr[1]

      // default undefined or missing values to empty string
      var value = keyValueArr[2] || ''

      // expand newlines in quoted values
      var len = value ? value.length : 0
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n')
      }

      obj[key] = value
    }
  })

  return obj
}