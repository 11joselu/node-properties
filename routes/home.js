const express = require ('express');
const router = express.Router ();
const {catchErrors} = require ('../handlers/errorHandlers');
const gitController = require ('../controllers/gitController');
const loginController = require ('../controllers/loginController');

router.get ('/', (req, res) => {
  res.render ('clone', {
    title: 'Start',
  });
});

router.post ('/logout', loginController.logout);
router.get ('/logout', loginController.logout);

router.get (
  '/clone',
  gitController.gitClone,
  gitController.gitFetchTags,
  gitController.readPropertiesFiles,
  gitController.changeToMaster,
  gitController.readPropertiesFilesFromMaster,
  gitController.gitCloneResponse
);

router.get ('/test', gitController.readPropertiesFiles);

module.exports = router;
