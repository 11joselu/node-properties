const {uniq, writeInFile} = require ('../utils/util-functions');
const {join} = require ('path');
const fs = require ('fs');
const promisify = require('es6-promisify');
const moment = require ('moment');
const Github = require ('github');
const jsesc = require('jsesc');

const util = require ('../utils/util-functions');
const {emitEvent} = require ('../handlers/ioHandlers');

const editTemplate = require('../views/edit.marko');

const github = new Github ({
  host: process.env.GITHUB_HOST,
  pathPrefix: '/api/v3',
  protocol: 'http',
  port: 8080,
  debug: process.env.NODE_ENV !== 'development'
});

const cleanString = (str) => {
  let newStr = jsesc(str, {json: true})
  .replace(/["]+/g, '');

  if (newStr.indexOf("\\\\") >= 0) {
    newStr = newStr.replace(/[\\]+/g, '\\"');
  }

  return newStr.replace(/\"u/g, 'u');
};

exports.getTemplate = (req, res, next) => {
  const {id} = req.params;
  const {tagName, tag, master} = req.session;
  let masterKeys = [];

  if (!id || !tagName) {
    return res.redirect ('/');
  }

  if (!tag && !master) {
    return res.redirect ('/');
  }

  const tagKeys = tag.map (t => {
    return {
      fileName: t.fileName,
      keys: Object.keys (t.content),
    };
  });

  const tagFiles = tag.map (t => t.fileName);

  master.forEach (m => {
    masterKeys = masterKeys.concat (Object.keys (m.content));
  });

  masterKeys = uniq (masterKeys);

  return res.marko (editTemplate, {
    title: 'Edit',
    tagKeys,
    tagFiles,
    masterKeys,
    master,
  });
};


exports.generateFiles = async (req, res, next) => {
  const properties = req.body;
  const {id} = req.params;
  const {tmpFolder} = req.session;
  const output_path = join (__dirname, '..', '.tmp', tmpFolder);
  const paths = process.env.SOURCE_PATH.split('-');
  const filesDir = join (output_path, ...paths);
  const filtereData = {};
  const files = [];
  let branch;

  github.authenticate({
    type: 'token',
    token: process.env.USER_TOKEN,
  });

  Object.keys (properties).forEach (key => {
    const [fileName, propertyKey] = key.split ('__');
    if (files.indexOf (fileName) < 0) {
      files.push (fileName);
    }

    if (!(fileName in filtereData)) {
      filtereData[fileName] = {};
    }
    
    filtereData[fileName][propertyKey] = cleanString(properties[key]);
  });

  try {

    const filesPath = files.forEach (f => {
      const filePath = join (filesDir, f);
      const content = filtereData[f];
      const logger = fs.createWriteStream (filePath);
      Object.keys (content).forEach (value => {
        let fileContent = `${value}=`;
        if (content[value]) {
          fileContent+=content[value];
        }
        logger.write (`${fileContent}\n`); // append string to your file
      });

      logger.end ();
    });

    const date = moment ().format ('DD-MM-YYYY_HH_mm');
    branch = `bot-${date}`;
    let command = `git checkout -b ${branch}`;
    emitEvent (req, res, `cmd start`, `Creating branch ${branch}`);
    await util.executeGitTask (req, res, output_path, command);

    command = `git status`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git add .`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git commit -m "bot: add new values into properties. Date of commit ${date}"`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git remote set-url origin ${process.env.GIT_URL}`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git remote -v`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git push --set-upstream origin ${branch}`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git status`;
    await util.executeGitTask (req, res, output_path, command);

    emitEvent (req, res, `cmd task`, `Creating a issue into repository`);

    /*const createIssue = promisify(github.issues.create, github);
    const issue = await createIssue({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      title: `[Bot] - Properties Modified at ${moment().format('DD/MM/YYYY')}`,
      body: `Properties has been modifies by node properties app\n\n **Branch:** ${branch}`,
      labels: ['bot', 'new']
    });

    emitEvent (req, res, `cmd task`, `Issue create link <a href="${issue.data.html_url}">${issue.data.html_url}</a>`);*/

    req.session.tagName = '';
    req.session.tag = undefined;
    req.session.master = undefined;

    command = `git checkout develop -f`;
    await util.executeGitTask (req, res, output_path, command);

    command = `git branch -D ${branch}`;
    await util.executeGitTask (req, res, output_path, command);

    util.successResponse (
      req,
      res,
      `Worker pushed new branch into the repository`
    );

  } catch (e) {
    let message = `Worker found an error. Contact to the administrator`;
    
    if (branch !== undefined) {
      message += `. Pass to administrator the branch name: <strong>${branch}</strong>`;
    }

    util.errorResponse (req, res, message);
  }
};
