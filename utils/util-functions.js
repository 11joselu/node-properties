const child_process = require ('child-process-promise');
const exec = child_process.exec;
const spawn = child_process.spawn;
const dotenv = require ('dotenv');
const fs = require ('fs');
const promisify = require ('es6-promisify');

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

exports.spawnCommand = (
  command,
  args,
  onData = console.log,
  onClose = console.log
) => {
  const child = spawn (command, args);
  child.stdout.on ('data', onData);
  child.on ('close', onClose);
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
    return file[file.length - 1] === process.env.FILE_EXTENSION;
  });
};

exports.getContentFromFile = async filePath => {
  if (this.isFile (filePath)) {
    return await this.readPropertiesFiles (filePath);
  }

  return null;
};
