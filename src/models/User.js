
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const ROLES = require("../constants/roles");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: "full_name",
      validate: {
        notEmpty: true,
        len: [2, 120]
      }
    },
    email: {
      type: DataTypes.STRING(190),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash"
    },
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
      defaultValue: ROLES.STUDENT
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true
  }
);

module.exports = User;
