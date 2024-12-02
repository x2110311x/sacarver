var DataTypes = require("sequelize").DataTypes;
var _Notes = require("./Notes");

function initModels(sequelize) {
  var Notes = _Notes(sequelize, DataTypes);


  return {
    Notes,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
