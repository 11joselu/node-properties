exports.getTemplate = (req, res, next) => {
  if (req.session.authenticated) {
    return res.redirect ('/');
  }
  res.render ('login', {title: 'Log in'});
};

exports.login = (req, res, next) => {
  const {username, password} = req.body;
  if (
    username === process.env.USER_APP_NAME &&
    password === process.env.USER_APP_PASSWORD
  ) {
    req.session.authenticated = true;
    res.redirect ('/');
  } else {
    res.render ('login', {
      title: 'Log in',
      error: 'Incorrect username or password',
    });
  }
};

exports.logout = (req, res, next) => {
  delete req.session.authenticated;
  res.redirect ('/login');
};
