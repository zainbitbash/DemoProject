import { SlashCommandBuilder } from "discord.js";

const remove = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("removes a keyword from database and stops fetching job."),
  async execute(sleep, interaction, page, keywords) {
    let reply;
    let existingKeyword;
    const channelId = interaction.channelId;
    try {
      try {
        existingKeyword = await keywords.findOne({
          where: { id: channelId },
          attributes: ["keyword"],
        });
        console.log("existing keyword to delete: ", existingKeyword);
        if (existingKeyword) {
          try {
            await keywords.destroy({
              where: {
                id: channelId,
              },
            });
            reply = "removed!";
          } catch (error) {
            console.error(
              "sorry cannot delete keyword from the database: ",
              error.message
            );
            reply = "already removed or removing in process";
          }
        } else {
          return "no keyword to remove!";
        }
      } catch (error) {
        console.error("Error during database check:", error.message);
        reply = "No keyword to remove";
        return reply;
      }
      console.log("checked from data base for remove");
      await sleep(2000);

      const manage = await page.waitForSelector(
        "::-p-xpath(//button[@type='button' and contains(@class, 'air3-btn-link') and normalize-space(text())='Manage'])",
        { timeout: 15000 }
      );
      await manage.click();
      await sleep(4000);
      // console.log("clicked on manage button");

      const keyFound = await page.evaluate(async (key) => {
        // const keys = document.querySelectorAll(
        //   "body > div.saved-search-list-edit-modal.page-enter.page-enter-active.air3-fullscreen-element > div > div.air3-fullscreen-container > div > div > div.air3-modal-body > div > div > div"
        // );

        const mainConatinerofKeys = document.evaluate(
          "//div[@class='air3-modal-body']/div",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue;

        console.log("main Div",mainConatinerofKeys);

        await new Promise((resolve) => {
          return setTimeout(() => {
            resolve();
          }, 5000);
        });

        const keysHTMLCollection = mainConatinerofKeys.children;
        const keys = Array.from(keysHTMLCollection);
console.log("keys", keys);

await new Promise((resolve) => {
  return setTimeout(() => {
    resolve();
  }, 5000);
});
        let keytodelete = null;

        keys.forEach((el) => {
          const keywordText = document
            .evaluate(
              "//div[@class='text-base-sm text-light-on-muted ellipsis mt-1x']",
              el,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            )
            .singleNodeValue?.textContent.trim()
            .toLowerCase();

          if (keywordText === key.trim().toLowerCase()) {
            keytodelete = document.evaluate(
              "//button[@type='button' and @data-test='delete-btn' and contains(@class, 'air3-btn-circle')]",
              el,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
          }
        });
        console.log("key to delete: ", keytodelete)
        await new Promise((resolve) => {
          return setTimeout(() => {
            resolve();
          }, 5000);
        });
        if (keytodelete) {
          try {
            await keytodelete.click();
            
            await new Promise((resolve) => {
              return setTimeout(() => {
                resolve();
              }, 2000);
            });

            console.log('clecked on keytodelete');

          } catch (error) {
            console.error("cannot click : ", error.message);
            return {
              found: false,
              message: "Keyword cannot be deleted rightnow",
            };
          }
          return {
            found: true,
            message: "Keyword found and deleted",
          };
        } else {
          return {
            found: false,
            message: "Keyword cannot be deleted rightnow",
          };
        }
      }, existingKeyword.keyword);

      if (keyFound.found) {
        const confirm = await page.waitForSelector(
          "::-p-xpath(//button[@data-test='delete-confirm-delete-btn' and normalize-space(text())='Delete'])",
          { timeout: 60000 }
        );
        await sleep(2000);
        await confirm.click();
        await sleep(4000);
        reply = keyFound.message;
      } else {
        reply = "sorry cannot found keyword";
      }
    } catch (err) {
      console.error("Error during the keyword removing process: ", err);
      reply = "An error occurred, cannot remove this keyword!";
    }
    await page.goto("https://www.upwork.com/nx/find-work/");
    await page.waitForSelector(
      "::-p-xpath(//input[@type='search' and @placeholder='Search for jobs'])",
      { timeout: 120000 }
    );
    await sleep(4000);
    return reply;
  },
};

export default remove;
