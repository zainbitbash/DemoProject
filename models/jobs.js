import { DataTypes } from "sequelize";
import sequelize from "./../db/db.js";

const jobs = sequelize.define(
  "jobs",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jobHref: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keywordId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default jobs;
