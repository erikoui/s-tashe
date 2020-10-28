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

    // TODO: this could be loaded from the database
    const rankingData = {
      ranks: ['newfag', 'pleb', 'rookie', 'new recruit',
        'experienced', 'veteran', 'coomer', 'wizard'],
      pointBreaks: [20, 100, 250, 500, 1000, 2000, 5000, 1000000],
      levels: [0, 1, 2, 3, 4, 5, 6, 7],
    };
    for (let i = 0; i < rankingData.ranks.length; i++) {
      if (user.points < rankingData.pointBreaks[i]) {
        return {level: rankingData.levels[i], rank: rankingData.ranks[i]};
      }
    }
    // this is returned when a user maxed out points with a hack
    return {level: 0, rank: '1337 h4xx0r'};
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

