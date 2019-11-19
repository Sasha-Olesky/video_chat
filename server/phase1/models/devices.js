var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var DevicesSchema   = new Schema({
    token: String, 
    device: String
});

module.exports = mongoose.model('device', DevicesSchema);
