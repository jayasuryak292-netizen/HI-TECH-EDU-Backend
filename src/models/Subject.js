

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Subject = sequelize.define(
  "Subject",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    streamId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "stream_id"
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 120]
      }
    },
    introduction: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "DRAFT"
    },
    displayOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "display_order"
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "created_by"
    }
  },
  {
    tableName: "subjects",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["stream_id"]
      },
      {
        unique: true,
        fields: ["stream_id", "name"],
        name: "subjects_stream_id_name_unique"
      }
    ]
  }
);

module.exports = Subject;
