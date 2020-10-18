
class TagsRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
  }

  // Returns all tag records;
  async all() {
    return this.db.any('SELECT * FROM tags');
  }
}


module.exports = TagsRepository;
