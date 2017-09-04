exports.checkAuth = (req, res, next) => {
  if (req.url !== '/login' && (!req.session || !req.session.authenticated)) {
    return res.redirect ('/login');
  }

  return next ();
};
