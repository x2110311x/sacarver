var DataTypes = require("sequelize").DataTypes;
var _Honeypot = require("./Honeypot");
var _NoteVersions = require("./NoteVersions");
var _Notes = require("./Notes");
var _PlaylistConfig = require("./PlaylistConfig");
var _PlaylistData = require("./PlaylistData");
var _ScamImageHashes = require("./ScamImageHashes");

function initModels(sequelize) {
  var Honeypot = _Honeypot(sequelize, DataTypes);
  var NoteVersions = _NoteVersions(sequelize, DataTypes);
  var Notes = _Notes(sequelize, DataTypes);
  var PlaylistConfig = _PlaylistConfig(sequelize, DataTypes);
  var PlaylistData = _PlaylistData(sequelize, DataTypes);
  var ScamImageHashes = _ScamImageHashes(sequelize, DataTypes);

  NoteVersions.belongsTo(Notes, { as: "parentNote", foreignKey: "NoteID", onDelete: "CASCADE" });
  Notes.hasMany(NoteVersions, { as: "NoteVersions", foreignKey: "NoteID"});
  PlaylistData.belongsTo(PlaylistConfig, { as: "Month_PlaylistConfig", foreignKey: "Month"});
  PlaylistConfig.hasMany(PlaylistData, { as: "PlaylistData", foreignKey: "Month"});

  return {
    Honeypot,
    NoteVersions,
    Notes,
    PlaylistConfig,
    PlaylistData,
    ScamImageHashes,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
