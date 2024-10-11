import { SlashCommandBuilder } from "discord.js";

const stop = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("stop fetching jobs for this keyword"),
  async execute(sleep, interaction, page, keywords) {
    let reply;
    const channelId = interaction.channelId;
    // console.log("Channel ID:", channelId);

    try {
      try {
        const existingKeyword = await keywords.findOne({
          where: { id: channelId },
          attributes: ["dofetching"],
        });

        if (existingKeyword.dofetching) {
          try {
            await keywords.update(
              { dofetching: false },
              { where: { id: channelId } }
            );
            reply = "stoped!";
          } catch (error) {
            console.log("cannot stop keyword: ", error.message);
            return "sorry cannot stop right now!";
          }
        } else {
          reply = " already stoped!";
        }
      } catch (error) {
        console.error("Error during database check:", error.message);
        return "No keyword!";
      }

      await page.goto("https://www.upwork.com/nx/find-work/");
      // await page.waitForNetworkIdle({ idleTime: 60000 });
      await sleep(4000);
      return reply;
    } catch (err) {
      console.error("Error during the keyword stopping process: ", err);
      await page.goto("https://www.upwork.com/nx/find-work/");
      // await page.waitForNetworkIdle({ idleTime: 60000 });
      await sleep(4000);
      return "An error occurred, cannot stop this keyword!";
    }
  },
};

export default stop;
