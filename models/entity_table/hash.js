'use strict';
module.exports = function (sequelize, DataTypes) {
  var Hash = sequelize.define('Hash', {
    Values: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(32),
    },
  }, {
    timestamps: true,
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      },
    },
  });
  return Hash;
};
