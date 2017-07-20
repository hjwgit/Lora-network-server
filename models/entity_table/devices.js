'use strict';
module.exports = function (sequelize, DataTypes) {
  var Device = sequelize.define('Device', {
    DevEUI: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(16),
    },
    Did: {
      allowNull: true,
      type: DataTypes.CHAR(22),
    },
    Passcode: {
      allowNull: true,
      type: DataTypes.CHAR(8),
    },
    DevAddr: {
      allowNull: true,
      type: DataTypes.CHAR(8),
    },
    FcntUp: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    FcntDown: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    AppSKey: {
      allowNull: true,
      type: DataTypes.CHAR(32),
    },
    NwkSKey: {
      allowNull: true,
      type: DataTypes.CHAR(32),
    },
    AppNonce: {
      allowNull: true,
      type: DataTypes.CHAR(6),
    },
  }, {
    timestamps: false,
    classMethods: {
      associate: function (models) {
        // associations can be defined here
      },
    },
  });
  return Device;
};
