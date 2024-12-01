var DataTypes = require("sequelize").DataTypes;
var _Notes = require("./Notes");
var _Users = require("./Users");

function initModels(sequelize) {
  var Notes = _Notes(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);

  Notes.belongsTo(Users, { as: "User_User", foreignKey: "User"});
  Users.hasMany(Notes, { as: "Notes", foreignKey: "User"});
  Notes.belongsTo(Users, { as: "Noter_User", foreignKey: "Noter"});
  Users.hasMany(Notes, { as: "Noter_Notes", foreignKey: "Noter"});

  return {
    Notes,
    Users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
