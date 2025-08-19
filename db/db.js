import { Sequelize } from "sequelize";
import { pathToFileURL } from "url";
// import Keyword from "../models/keywords.js";
// import jobs from "../models/jobs.js";


const sequelize = new Sequelize("upworkjobs", "root", "bitbash123", {
  host: "localhost", 
  dialect: "mysql", 
  logging: false, 
  pool: {
    max: 5, 
    min: 0, 
    acquire: 30000, 
    idle: 10000, 
  },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    try {
        const fileUrl = pathToFileURL('./models/keywords.js').href;
        const keywords = await import(fileUrl);
      await sequelize.sync({ force: false });
      console.log("Database & tables created!");
      try {
        const fileUrl = pathToFileURL('./models/jobs.js').href;
        const keywords = await import(fileUrl);
      await sequelize.sync({ force: false });
      } catch (error) {
        console.error("Error creating table jobs:", error);
      }
    } catch (error) {
      console.error("Error creating table keywords:", error);
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

export default sequelize;
