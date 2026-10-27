"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Stream = sequelize.define(
  "Stream",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 20],
        is: /^[A-Z0-9_-]+$/
      }
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 120]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    tableName: "streams",
    timestamps: true,
    underscored: true
  }
);

module.exports = Stream;
