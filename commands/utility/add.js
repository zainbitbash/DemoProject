// import { SlashCommandBuilder } from "discord.js";

// const add = {
//   data: new SlashCommandBuilder()
//     .setName("add")
//     .setDescription("Adds a keyword to the database and starts fetching jobs.")
//     .addStringOption((option) =>
//       option
//         .setName("keyword")
//         .setDescription("The keyword to add for job fetching")
//         .setRequired(true)
//     ),
//     // to add keyword by puppeteer.
//   // async execute(sleep, interaction, page, keywords) {
//   //   let reply;
//   //   const channelId = interaction.channelId;
//   //   const key = interaction.options.getString("keyword");

//   //   try {
//   //     try {
//   //       console.log('going to check database with channel id if it exist or no?');
//   //       const existingKeyword = await keywords.findOne({
//   //         where: { id: channelId },
//   //       });
//   //       console.log('the result is:', existingKeyword);
//   //       if (existingKeyword) {
//   //         console.log('result found!');
//   //         reply = "This channel already has a keyword added!";
//   //         return reply;
//   //       } else {
//   //         console.log('no result found for this channel id!');
//   //         const existingKeyword = await keywords.findOne({
//   //           where: { keyword: key },
//   //         });

//   //         if (existingKeyword) {
//   //           reply = "this keyword already exist on another channel";
//   //           return reply;
//   //         }
//   //         try {
//   //           await keywords.create({
//   //             id: channelId,
//   //             keyword: key,
//   //             dofetching: false,
//   //           });
//   //         } catch (error) {
//   //           console.error("Could not add keyword to database: ", error.message);
//   //           reply = "sorry Could not add keyword to the database try again.";
//   //           return reply;
//   //         }
//   //       }
//   //     } catch (error) {
//   //       console.error("Error during database check:", error.message);
//   //       reply = "An error occurred during the database check.";
//   //       return reply;
//   //     }

//   //     await sleep(3000);
//   //     const searchBar = await page.waitForSelector(
//   //       '::-p-xpath((//input[@data-cy="search-input"])[2])',
//   //       { timeout: 60000 }
//   //     );
//   //     await searchBar.focus();
//   //     await searchBar.type(key);
//   //     await page.keyboard.press("Enter");

//   //     await sleep(5000);
//   //     const saveBtn = await page.waitForSelector(
//   //       "::-p-xpath(//button[@id='save-search-btn' or @data-test='save-search-btn'])",
//   //       { timeout: 30000 }
//   //     );
//   //     await sleep(3000);
//   //     await saveBtn.click();

//   //     await sleep(3000);
//   //     const confirm = await page.waitForSelector(
//   //       '::-p-xpath((//div[@data-test="SaveSearchForm"]//button)[2])',
//   //       { timeout: 60000 }
//   //     );

//   //     await confirm.click();
//   //     await sleep(4000);

//   //     await page.goto("https://www.upwork.com/nx/find-work/");
//   //     await page.waitForSelector(
//   //       "::-p-xpath(//input[@type='search' and @placeholder='Search for jobs'])",
//   //       { timeout: 120000 }
//   //     );
//   //     await sleep(5000);
//   //     reply = "Keyword is added!";
//   //     return reply;
//   //   } catch (err) {
//   //     console.error("Error during the keyword addition process: ", err);
//   //     await page.goto("https://www.upwork.com/nx/find-work/");
//   //     await page.waitForSelector(
//   //       "::-p-xpath(//input[@type='search' and @placeholder='Search for jobs'])",
//   //       { timeout: 120000 }
//   //     );
//   //     await sleep(1000);
//   //     reply = "An error occurred, cannot add this keyword!";
//   //     return reply;
//   //   }
//   // },
//   async execute(sleep, interaction, page, keywords) {
//     let reply;
//     const channelId = interaction.channelId;
//     const key = interaction.options.getString("keyword").trim().toLowerCase();
//     console.log(channelId)
//     console.log(key)

//     try {
//       try {
//         // const existingKeyword = await keywords.findOne({
//         //   where: { id: channelId },
//         // });

//         // if (existingKeyword) {
//         //   reply = "This channel already has a keyword added!";
//         // } else {
//           const existingKeyword = await keywords.findOne({
//             where: { keyword: key },
//           });
//           if (existingKeyword) {
//             reply = "this keyword already exist on another channel";
//           }
//           else{

//           //   const keyw = await page.evaluate((inputKey) => {
//           //     const listOfSavedKeywords = document.querySelectorAll(
//           //         "div.air3-token-container.saved-search-list > div > a"
//           //     );

//           //     for (let i = 0; i < listOfSavedKeywords.length; i++) {
//           //         const content = listOfSavedKeywords[i].textContent.trim().toLowerCase();
//           //         if (content === inputKey) {
//           //             return content;
//           //         }
//           //     }
//           //     return null;
//           // }, key)
//         // if(keyw){
//           try {
//             await keywords.create({
//               ChannelId: channelId,
//               keyword: key,
//               dofetching: false,
//             });
//             reply = "keyword is added!";
//           } catch (error) {
//             console.error("Could not add keyword to database: ", error.message);
//             reply = "sorry Could not add keyword to the database try again.";
//           }
//         // } else{
//         //   reply = "keyword is not in saved list";
//         // }
          
//             }
//         // }
//       } catch (error) {
//         console.error("Error during database check:", error.message);
//         reply = "An error occurred during the database check.";
//       }

//     } catch (err) {
//       console.error("Error during the keyword addition process: ", err);

//       reply = "An error occurred, cannot add this keyword!";

//     } finally {
//       // await page.goto("https://www.upwork.com/nx/find-work/", {
//       //   waitUntil: 'networkidle0'
//       // });
//       // await page.waitForSelector(
//       //   "::-p-xpath(//input[@type='search' and @placeholder='Search for jobs'])",
//       //   { timeout: 120000 }
//       // );
//       // await sleep(1000);
//       return reply;
//     }
//   }
// };

// export default add;



import { SlashCommandBuilder } from "discord.js";

const add = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds a keyword to the database and starts fetching jobs.")
    .addStringOption((option) =>
      option
        .setName("keyword")
        .setDescription("The keyword to add for job fetching")
        .setRequired(true)
    ),

  async execute(sleep, interaction, page, keywords) {
    let reply;
    const channelId = interaction.channelId;
    const key = interaction.options.getString("keyword").trim().toLowerCase();

    try {
      await keywords.create({
        ChannelId: channelId,
        keyword: key,
        dofetching: true,
      });
      reply = "Keyword added and fetching started!";
    } catch (error) {
      console.error("Could not add keyword to database: ", error.message);
      reply = "Error: Could not add keyword to the database. Please try again.";
    }

    return reply;
  },
};

export default add;
