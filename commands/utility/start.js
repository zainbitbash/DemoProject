import { SlashCommandBuilder } from "discord.js";

const start = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("starts fetching jobs for this keyword"),
  async execute(sleep, interaction, page, keywords) {
    let reply;
    const channelId = interaction.channelId;
    // console.log("Channel ID:", channelId);

    if (channelId === '1278462496314757247') {
      reply = 'started!'
      return reply;
    }

    try {
      try {
        const existingKeyword = await keywords.findOne({
          where: { id: channelId },
          attributes: ["dofetching"],
        });

        if (!existingKeyword.dofetching) {
          try {
            await keywords.update(
              { dofetching: true },
              { where: { id: channelId } }
            );
            reply = "started!";
          } catch (error) {
            console.log("cannot start keyword: ", error.message);
            return "sorry cannot start right now!";
          }
        } else {
          reply = " already started!";
        }
      } catch (error) {
        console.error("Error during database check:", error.message);
        return "no keyword!";
      }

      await page.goto("https://www.upwork.com/nx/find-work/");
      // await page.waitForNetworkIdle({ idleTime: 60000 });
      await sleep(4000);
      return reply;
    } catch (err) {
      console.error("Error during the keyword starting process: ", err);
      await page.goto("https://www.upwork.com/nx/find-work/");
      // await page.waitForNetworkIdle({ idleTime: 60000 });
      await sleep(4000);
      return "An error occurred, cannot start this keyword!";
    }
  },
};

export default start;
