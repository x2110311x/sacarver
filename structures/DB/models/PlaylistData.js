const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PlaylistData', {
    ID: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    User: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Track: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Link: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Reasoning: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    Picked: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    Month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PlaylistConfig',
        key: 'ID'
      }
    }
  }, {
    sequelize,
    tableName: 'PlaylistData',
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
      {
        name: "month_index",
        using: "BTREE",
        fields: [
          { name: "Month" },
        ]
      },
    ]
  });
};
