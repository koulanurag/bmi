var mongoose = require('mongoose');

var ParameterSchema = new mongoose.Schema({
  name: String,
  costpools: String,
});

mongoose.model('Parameter', ParameterSchema);
