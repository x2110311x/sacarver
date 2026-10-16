var DataTypes = require("sequelize").DataTypes;
var _Honeypot = require("./Honeypot");
var _Notes = require("./Notes");
var _NoteVersions = require("./NoteVersions");
var _PlaylistConfig = require("./PlaylistConfig");
var _PlaylistData = require("./PlaylistData");
var _ScamImageHashes = require("./ScamImageHashes");

function initModels(sequelize) {
  var Honeypot = _Honeypot(sequelize, DataTypes);
  var Notes = _Notes(sequelize, DataTypes);
  var NoteVersions = _NoteVersions(sequelize, DataTypes);
  var PlaylistConfig = _PlaylistConfig(sequelize, DataTypes);
  var PlaylistData = _PlaylistData(sequelize, DataTypes);
  var ScamImageHashes = _ScamImageHashes(sequelize, DataTypes);

  PlaylistData.belongsTo(PlaylistConfig, { as: "Month_PlaylistConfig", foreignKey: "Month"});
  PlaylistConfig.hasMany(PlaylistData, { as: "PlaylistData", foreignKey: "Month"});

  NoteVersions.belongsTo(Notes, { as: "parentNote", foreignKey: "NoteID", onDelete: "CASCADE" });
  Notes.hasMany(NoteVersions, { as: "versions", foreignKey: "NoteID" });

  return {
    Honeypot,
    Notes,
    NoteVersions,
    PlaylistConfig,
    PlaylistData,
    ScamImageHashes,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
