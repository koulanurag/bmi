var mongoose = require('mongoose');

var ScenarioSchema = new mongoose.Schema({
  name: String,
  description: String,
  user: String,
  services: String,
  parameters: [{
    name: String, 
    value: String,
    applytoquarters: String,
    comment: String
  }]
});

ScenarioSchema.methods.update = function(update, cb) {
  this.name = update.name;
  this.user = update.user;
  this.services = update.services;
  this.parameters = update.parameters;
  this.save(cb);
};
mongoose.model('Scenario', ScenarioSchema);
