'use strict';
module.exports = function (sequelize, DataTypes) {
  var App = sequelize.define('App', {
    AppEUI: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.CHAR(16),
    },
    ProductKey: {
      allowNull: false,
      type: DataTypes.CHAR(32),
    },
    AppKey: {
      allowNull: false,
      type: DataTypes.CHAR(32),
    },
    NetID: {
      allowNull: false,
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
  return App;
};
