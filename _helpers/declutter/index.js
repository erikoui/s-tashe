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
    this.votePointIncrement=1;
    this.rankingData = {
      ranks: ['newfag', 'pleb', 'rookie', 'new recruit',
        'experienced', 'veteran', 'coomer', 'wizard'],
      pointBreaks: [20, 100, 250, 500, 1000, 2000, 5000, 1000000],
      levels: [0, 1, 2, 3, 4, 5, 6, 7],
    };
    console.log('Declutter loaded');
  }

  /**
   * Converts the users points to a text description
   * @param {any} user - the user object returned by login
   *
   * @return {Object} the user rank
   */
  makeRank(user) {
    if (user.admin) {
      return {level: 10, rank: 'Master baiter (admin)'};
    }

    
    for (let i = 0; i < this.rankingData.ranks.length; i++) {
      if (user.points < this.rankingData.pointBreaks[i]) {
        return {
          level: this.rankingData.levels[i],
          rank: this.rankingData.ranks[i],
        };
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

