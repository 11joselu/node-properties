const express = require ('express');
const router = express.Router ();
const loginController = require ('../controllers/loginController');

router.get ('/', loginController.getTemplate);
router.post ('/', loginController.login);

module.exports = router;
