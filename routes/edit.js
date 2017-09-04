const express = require ('express');
const router = express.Router ();
const {catchErrors} = require ('../handlers/errorHandlers');
const editController = require ('../controllers/editController');

router.get ('/:id', editController.getTemplate);
router.post ('/values', editController.generateFiles);
module.exports = router;
