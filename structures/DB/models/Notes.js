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
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID'
      }
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
    ChannelID: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    MessageID: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    Noter: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'ID'
      }
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
      {
        name: "Noter",
        using: "BTREE",
        fields: [
          { name: "Noter" },
        ]
      },
    ]
  });
};
