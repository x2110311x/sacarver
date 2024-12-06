var DataTypes = require("sequelize").DataTypes;
var _Notes = require("./Notes");
var _PlaylistConfig = require("./PlaylistConfig");
var _PlaylistData = require("./PlaylistData");

function initModels(sequelize) {
  var Notes = _Notes(sequelize, DataTypes);
  var PlaylistConfig = _PlaylistConfig(sequelize, DataTypes);
  var PlaylistData = _PlaylistData(sequelize, DataTypes);

  PlaylistData.belongsTo(PlaylistConfig, { as: "Month_PlaylistConfig", foreignKey: "Month"});
  PlaylistConfig.hasMany(PlaylistData, { as: "PlaylistData", foreignKey: "Month"});

  return {
    Notes,
    PlaylistConfig,
    PlaylistData,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
