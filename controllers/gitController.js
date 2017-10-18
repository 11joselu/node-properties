const {join} = require ('path');
const util = require ('../utils/util-functions');
const {emitEvent} = require ('../handlers/ioHandlers');
const {mkdtempSync} = require ('fs');
const {TMP_PREFIX} = require('../utils/constants');

let tmpFolder;
let output_path;

/**
 * Reall all files and generate array of content files
 */
const getDataFromArrayOfFiles = (filesDir, files, req, res) => {
  const data = [];

  // Wait for all files
  files.map (async fileName => {
    const filePath = join (filesDir, fileName); // path of the file
    const fileData = {fileName}; // init ouput object data
    emitEvent (
      req,
      res,
      `cmd message`,
      `Reading file ${util.getWorkingPath (filePath, tmpFolder)}`
    );

    // load content data
    const content =  util.getContentFromFile (filePath);
    if (content !== null) {
      fileData.content = content;
      // add into array of data files
      data.push (fileData);
    }
  })

  if (data.length !== 0) {
    emitEvent (req, res, `cmd end`, '<strong>Successfully</strong> loaded');
  }

  return data;
};

const readPropertiesFiles = async (req, res) => {
  const paths = process.env.SOURCE_PATH.split('-');
  // Path for properties files
  const filesDir = join (output_path, ...paths);
  // Get all files (skip directories)
  const files = await util.getPropertiesFromDirectory (filesDir);

  emitEvent (
    req,
    res,
    `cmd pending`,
    `Reading properties files from ${util.getWorkingPath (filesDir, tmpFolder)}`
  );

  // Create list of html files
  const filesHTML = files.map (x => `<br /> <span class="file">${x}</span>`);

  if (filesHTML.length === 0) {
    emitEvent (req, res, `cmd error`, 'No files found');
  } else {
    emitEvent (
      req,
      res,
      `cmd message`,
      `List of <strong>Files found:</strong> ${filesHTML.join ('')}`
    );
  }

  return getDataFromArrayOfFiles (filesDir, files, req, res);
};

const cloneRepo = async(req, res, next) => {
  try {
    const url = process.env.GIT_URL;
    await util.executeCommand (`rm -rf ${tmpFolder}`);
    // clone repository into output path
    emitEvent (
      req,
      res,
      `cmd task`,
      `git clone ${url} <strong>into ${tmpFolder}/</strong>`
    );
    await util.executeCommand (`git clone ${url} ${output_path}`);
    next ();
  } catch (e) {
    emitEvent (req, res, `cmd error`, `Error cloning...`);
    util.errorResponse (req, res, undefined, e);
  }
 
}

/**
 * Clone repository into ./tmp/
 */
exports.gitClone = async (req, res, next) => {
  tmpFolder = 'openppm';
  output_path = join (__dirname, '..', '.tmp', tmpFolder);
  try {
    const dirs = util.readDir(output_path);
    emitEvent (req, res, `cmd start`, `Starting...`);
    next();
  } catch (e) {
    emitEvent (req, res, `cmd start`, `Starting...`);
    await cloneRepo(req, res, next)
  }
};

/**
 * cd into donwload repository
 *  and fetch all tags
 */
exports.gitFetchTags = async (req, res, next) => {
  try {
    // load last version tag
    let command = `git for-each-ref refs/tags/V-* --sort=-taggerdate --format='%(refname)' --count=1`;
    let commandResult = await util.executeGitTask (
      req,
      res,
      output_path,
      command
    );

    const tagName = commandResult.stdout.toString ().replace ('\n', '');

    if (!tagName) {
      return res.marko (errorTemplate, {message: 'No tag found'});
    }
    
    // Checkout into version branch
    command = `git checkout ${tagName} -f`;
    await util.executeGitTask (req, res, output_path, command);
    req.session.tagName = tagName;
    // check branch
    command = `git status`;
    await util.executeGitTask (req, res, output_path, command);

    next ();
  } catch (e) {
    emitEvent (req, res, `cmd error`, `Error doing checkout to tag ...`);
    util.errorResponse (req, res, undefined, e);
  }
};

/**
 * Read all properties files into a directory
 */
exports.readPropertiesFiles = async (req, res, next) => {
  try {
    req.session.tag = await readPropertiesFiles (req, res);
    next ();
  } catch (e) {
    emitEvent (req, res, `cmd error`, `Error reading properties files ...`);
    util.errorResponse (req, res, undefined, e);
  }
};

exports.changeToMaster = async (req, res, next) => {
  try {
    emitEvent (req, res, `cmd pending`, `Change to develop`);
    // Checkout to master branch
    let command = `git checkout -B develop origin/develop`;
    await util.executeGitTask (req, res, output_path, command);
    // Show current branch
    command = `git branch`;
    await util.executeGitTask (req, res, output_path, command);

    // Pull changes
    command = `git pull`;
    await util.executeGitTask (req, res, output_path, command);
    next ();
  } catch (e) {
    emitEvent (req, res, `cmd error`, `Error doing checkout to master ...`);
    util.errorResponse (req, res, undefined, e);
  }
};

exports.readPropertiesFilesFromMaster = async (req, res, next) => {
  try {
    const master = await readPropertiesFiles (req, res);
    req.session.master = master;
    next ();
  } catch (e) {
    emitEvent (req, res, `cmd error`, `Error reading master properties files ...`);
    util.errorResponse (req, res, undefined, e);
  }
};

exports.gitCloneResponse = async (req, res, next) => {
  if (req.session.tag.length === 0 && req.session.master.length === 0) {
    return util.errorResponse (req, res, 'Worker tasks ended');
  }
  emitEvent (req, res, `cmd end`, 'Worker tasks ended');
  const id = tmpFolder.split (TMP_PREFIX).filter (x => x).join ('');
  req.session.tmpFolder = tmpFolder;
  res.json ({
    status: 200,
    data: {
      id,
      data: [req.tag, req.master],
    },
    message: 'done',
  });
};
