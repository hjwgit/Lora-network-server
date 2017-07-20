'use strict';
module.exports = function (sequelize, DataTypes) {
  var App2Device = sequelize.define('App2Device', {
    DevEUI: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(16),
    },
    AppEUI: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(16),
    },
  }, {
    timestamps: false,
    classMethods: {
      associate: function (models) {
        // associations can be defined here
        models.App.hasMany(models.App2Device, {
          foreignKey: 'AppEUI',

          // through: models.App2Device,
          // constraints: false,
        });
        models.Device.hasOne(models.App2Device, {
          foreignKey: 'DevEUI',

          // through: models.App2Device,
          // constraints: false,
        });
      },
    },
  });
  return App2Device;
};
