/**
 * @module Declutter
 */

/**
 * Some helper functions to make index.js smaller
 * @class
 */
class Declutter {
  /**
   * @constructor
   */
  constructor() {
    // Some globals could be defined here
    console.log('Declutter loaded');
  }
  /**
   * Converts the users points to a text description
   * @param {any} user - the user object returned by login
   *
   * @return {string} the user rank
   */
  makeRank(user) {
    if (user.admin) {
      return {level: 10, rank: 'Master baiter (admin)'};
    }
    if (user.points < 100) {
      return {level: 1, rank: 'pleb'};
    } else if (user.points < 250) {
      return {level: 2, rank: 'rookie'};
    } else if (user.points < 500) {
      return {level: 3, rank: 'new recruit'};
    } else if (user.points < 1000) {
      return {level: 4, rank: 'experienced'};
    } else if (user.points < 2000) {
      return {level: 5, rank: 'veteran'};
    } else if (user.points < 5000) {
      return {level: 6, rank: 'coomer'};
    } else {
      return {level: 7, rank: 'wizard'};
    }
  }

  /**
 * handles errors
 * @function
 * @param{Error} err - the error to handle
 * @param{Request} req - the request to process
 * @param{Response} res - the response to send back
 * @param{Function} next - i have no idea
 * @return{void}
 */
  errorHandler(err, req, res, next) {
    if (typeof (err) === 'string') {
    // custom application error
      return res.status(400).json({message: err});
    }

    // default to 500 server error
    return res.status(500).json({message: err.message});
  }
}

module.exports = Declutter;

