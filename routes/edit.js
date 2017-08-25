const express = require ('express');
const router = express.Router ();
const {catchErrors} = require ('../handlers/errorHandlers');

router.get ('/:id', (req, res) => {
  const {id} = req.params;
  res.render ('edit', {
    title: 'Edit',
  });
});

module.exports = router;
