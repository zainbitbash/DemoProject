import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds a keyword to the database and starts fetching jobs.")
    .addStringOption((option) =>
      option
        .setName("keyword")
        .setDescription("The keyword to add for job fetching")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("start")
    .setDescription(
      "starts fetching job for the keyword added by this channel"
    ),
  new SlashCommandBuilder()
    .setName("remove")
    .setDescription("removes a keyword from database and stops fetching job."),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("stop fetching jobs for this keyword"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

export default async function registerCommand() {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
