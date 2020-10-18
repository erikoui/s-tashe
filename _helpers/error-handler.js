module.exports = errorHandler;

/**
 * Grabs pictures from the given thread
 * @function
 * @param{Error} err - the error to handle
 * @param{Request} req - the request to process
 * @param{Response} res - the response to send back
 * @param{Function} next - i have no idea
 * @return{void}
 */
function errorHandler(err, req, res, next) {
  if (typeof (err) === 'string') {
    // custom application error
    return res.status(400).json({message: err});
  }

  // default to 500 server error
  return res.status(500).json({message: err.message});
}
