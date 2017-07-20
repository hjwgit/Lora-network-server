'use strict';
module.exports = function (sequelize, DataTypes) {
  var Gateway = sequelize.define('Gateway', {
    GatewayId: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(16),
    },
    Address: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    PullPort: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    PushPort: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    Did: {
      allowNull: true,
      type: DataTypes.CHAR(22),
    },
    Passcode: {
      allowNull: true,
      type: DataTypes.CHAR(8),
    },
  }, {
    timestamps: true,
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      },
    },
  });
  return Gateway;
};
