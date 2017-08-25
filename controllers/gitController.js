const {join} = require ('path');
const util = require ('../utils/util-functions');
const {emitEvent} = require ('../handlers/ioHandlers');
const {mkdtempSync} = require ('fs');
let tmpFolder;
let output_path;
/**
 * Execute and emit git tasks
 *  return response task
 */
const executeGitTask = async (req, res, command, message = '') => {
  let commandResult = {};
  emitEvent (req, res, `cmd task`, message || command);
  // Execute task and wait for a response
  commandResult = await util.executeCommand (command, {cwd: output_path});
  // Emit response
  emitEvent (
    req,
    res,
    `cmd message`,
    commandResult.stderr || commandResult.stdout
  );
  return commandResult;
};

const createBrMessage = message => {
  return `<br /><br /> ${message}`;
};

//Remove __dirname from path
const getWorkingPath = path => {
  return path.substring (path.indexOf (tmpFolder));
};

/**
 * Reall all files and generate array of content files
 */
const getDataFromArrayOfFiles = async (filesDir, files, req, res) => {
  const data = [];

  // Wait for all files
  await Promise.all (
    files.map (async fileName => {
      const filePath = join (filesDir, fileName); // path of the file
      const fileData = {fileName}; // init ouput object data
      emitEvent (
        req,
        res,
        `cmd message`,
        `Reading file ${getWorkingPath (filePath)}`
      );

      // load content data
      const content = await util.getContentFromFile (filePath);
      if (content !== null) {
        fileData.content = content;
        // add into array of data files
        data.push (fileData);
      }
    })
  );

  emitEvent (req, res, `cmd end`, '<strong>Successfully</strong> loaded');
  return data;
};

const readPropertiesFiles = async (req, res) => {
  // Path for properties files
  const filesDir = join (output_path, 'src', 'main', 'resources');
  // Get all files (skip directories)
  const files = await util.getPropertiesFromDirectory (filesDir);

  emitEvent (
    req,
    res,
    `cmd pending`,
    createBrMessage (
      `Reading properties files from ${getWorkingPath (filesDir)}`
    )
  );

  // Create list of html files
  const filesHTML = files
    .map (x => `<br /> <span class="file">${x}</span>`)
    .join ('');

  emitEvent (
    req,
    res,
    `cmd message`,
    `List of <strong>Files found:</strong> ${filesHTML}`
  );

  return await getDataFromArrayOfFiles (filesDir, files, req, res);
};

/**
 * Clone repository into ./tmp/
 */
exports.gitClone = async (req, res, next) => {
  // create a temporal folder
  tmpFolder = mkdtempSync (process.env.TMP_PREFIX);
  // create output path
  output_path = join (__dirname, '..', '.tmp', tmpFolder);
  const url = process.env.GIT_URL;
  // clean output path
  emitEvent (req, res, `cmd start`, `rm -rf ${tmpFolder}`);
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
};

/**
 * cd into donwload repository
 *  and fetch all tags
 */
exports.gitFetchTags = async (req, res, next) => {
  // load last version tag
  let command = `git for-each-ref refs/tags --sort=-taggerdate --format='%(refname)' --count=1`;
  let commandResult = await executeGitTask (req, res, command);
  const tagName = commandResult.stdout.toString ().replace ('\n', '');
  // Checkout into version branch
  command = `git checkout ${tagName}`;
  await executeGitTask (req, res, command);
  req.tagName = tagName;
  // check branch
  command = `git status`;
  await executeGitTask (req, res, command);

  next ();
};

/**
 * Read all properties files into a directory
 */
exports.readPropertiesFiles = async (req, res, next) => {
  req.tag = await readPropertiesFiles (req, res);
  next ();
};

exports.changeToMaster = async (req, res, next) => {
  emitEvent (req, res, `cmd pending`, createBrMessage (`Change to master`));
  // Checkout to master branch
  let command = `git checkout test-properties`;
  await executeGitTask (req, res, command);
  // Show current branch
  command = `git branch`;
  await executeGitTask (req, res, command);

  // Pull changes
  command = `git pull`;
  await executeGitTask (req, res, command);
  next ();
};

exports.readPropertiesFilesFromMaster = async (req, res, next) => {
  req.master = await readPropertiesFiles (req, res);
  next ();
};

exports.gitCloneResponse = async (req, res, next) => {
  // clean output path and codes
  await util.executeCommand (`rm -rf ${output_path}`);
  emitEvent (req, res, `cmd end`, '<strong>Worker tasks ended</strong>');
  const id = tmpFolder.split (process.env.TMP_PREFIX).filter (x => x).join ('');

  res.json ({
    status: 200,
    data: {
      id,
      data: [req.tag, req.master],
    },
    message: 'done',
  });
};
