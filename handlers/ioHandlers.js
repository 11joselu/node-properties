exports.emitEvent = (req, res, eventName, data) => {
  res.io.emit (eventName, data);
};
