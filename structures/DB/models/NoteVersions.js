const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('NoteVersions', {
    ID: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    NoteID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Notes',
        key: 'ID'
      }
    },
    Version: {
      type: DataTypes.INTEGER,
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
      allowNull: true
    },
    Editor: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    Date: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'NoteVersions',
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
        name: "note_version_idx",
        using: "BTREE",
        fields: [
          { name: "NoteID" },
          { name: "Version" },
        ]
      },
    ]
  });
};
