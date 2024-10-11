import { DataTypes } from "sequelize";
import sequelize from "./../db/db.js";
import jobs from "./jobs.js";  // Import jobs after it is defined

const Keyword = sequelize.define(
  "Keyword",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
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
    timestamps: true,
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
