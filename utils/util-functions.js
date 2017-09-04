const child_process = require ('child-process-promise');
const exec = child_process.exec;
const spawn = child_process.spawn;
const dotenv = require ('dotenv');
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
exports.readPropertiesFiles = async path => {
  const readFilePromise = promisify (fs.readFile);
  const buf = await readFilePromise (path);
  return dotenv.parse (buf);
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

exports.getContentFromFile = async filePath => {
  if (this.isFile (filePath)) {
    return await this.readPropertiesFiles (filePath);
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
  message = `Worker found an error. Contact to the administrator`
) => {
  emitEvent (req, res, `cmd error`, message);

  res.status (500);
  res.json ({
    status: 500,
    data: [],
    message: 'Ops! Something went wrong',
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
