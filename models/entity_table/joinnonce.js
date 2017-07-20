'use strict';
module.exports = function (sequelize, DataTypes) {
  var JoinNonce = sequelize.define('JoinNonce', {
    DevNonce: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(4),
    },
  }, {
    timestamps: true,
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      },
    },
  });
  return JoinNonce;
};
