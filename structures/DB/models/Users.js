const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    ID: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(33),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Users',
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
