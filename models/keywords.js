import { DataTypes } from "sequelize";
import sequelize from "./../db/db.js";
import jobs from "./jobs.js";

const Keyword = sequelize.define(
  "Keyword",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ChannelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keyword: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dofetching: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

// Define the associations here
Keyword.hasMany(jobs, {
  foreignKey: "keywordId",
  sourceKey: "id",
  onDelete: "CASCADE",
});

jobs.belongsTo(Keyword, {
  foreignKey: "keywordId",
  targetKey: "id",
});

export default Keyword;
