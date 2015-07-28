var mongoose = require('mongoose');

var IssueSchema = new mongoose.Schema({
  creator: String,
  question: String,
  tousers: [{type: String}]
});

mongoose.model('Issue', IssueSchema);
