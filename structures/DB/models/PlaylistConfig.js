const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PlaylistConfig', {
    ID: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ThemeTitle: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ThemeDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    maxSubmissions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2
    }
  }, {
    sequelize,
    tableName: 'PlaylistConfig',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "ID" },
        ]
      },
    ]
  });
};
