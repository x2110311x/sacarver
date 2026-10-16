const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Notes', {
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
    Date: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Note: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Severity: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    Link: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    Noter: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'Notes',
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
        name: "user_index",
        using: "BTREE",
        fields: [
          { name: "User" },
        ]
      },
    ]
  });
};
