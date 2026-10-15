const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ScamImageHashes', {
    ID: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    Hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: 'Hash'
    },
    Label: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'Scam Image'
    },
    AddedBy: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    DateAdded: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    MatchCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'ScamImageHashes',
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
        name: "Hash",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "Hash" },
        ]
      },
    ]
  });
};
