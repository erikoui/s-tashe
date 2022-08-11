
const {Users, Pictures, Tags, Reports, Blog, Edits} = require('./repo');
db={};

db.users = new Users();
db.pictures = new Pictures();
db.tags = new Tags();
db.reports = new Reports();
db.blog = new Blog();
db.edits = new Edits();

module.exports = {db};
