
    import dotenv from "dotenv";
    import scrollRandomly from "./scroll.js";
    import reload from "./reload.js";
    import db from "./db/db.js";
    import keywords from "./models/keywords.js";
    import jobstable from "./models/jobs.js";
    // import express from "express";
    import { check, stopLoop, startLoop } from "./loopCheck.js";
    import registerCommand from "./registerCommands.js";
    import { fileURLToPath, pathToFileURL } from "url";
    import path from "path";
    import fs from "fs";
    import { Collection, Client, GatewayIntentBits } from "discord.js";

    // Load environment variables from .env file
    dotenv.config({ path: "./config.env" });

    // Import custom modules
    import sleep from "./sleep.js";
    import initialize from "./launchBrowse.js";
    import getkeywords from "./getkeywords.js";

    const BOT_START_TIME = new Date();
    console.log(`Bot started at: ${BOT_START_TIME.toLocaleTimeString()}`);
    const BOT_FILTER_TIME = new Date(BOT_START_TIME.getTime() - 30 * 60 * 1000); // 30 minutes before start
    console.log(`Filtering jobs older than: ${BOT_FILTER_TIME.toLocaleTimeString()}`);  

    let browser;
    let page;
    let timeoutId;
    let jobs = [];
    let elementsToClickOn = [];
    let index = 0;

    try {
      await registerCommand();
      await sleep(3000);
    } catch (error) {
      console.log("error in registering command: ", error.message);
    }
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    client.commands = new Collection();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const foldersPath = path.join(__dirname, "commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        // Convert file path to a file URL for dynamic import
        const fileUrl = pathToFileURL(filePath).href;

        try {
          // Dynamically import the command module
          const importedModule = await import(fileUrl);
          const command = importedModule.default;
          // Ensure the command module has the necessary properties
          if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
          } else {
            console.log(
              `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
          }
        } catch (error) {
          console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
        }
      }
    }

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      const command = client.commands.get(interaction.commandName);

      if (!command) return;
      try {
        clearTimeout(timeoutId);
        await interaction.deferReply();
        await stopLoop();
        const reply = await command.execute(sleep, interaction, page, keywords);
        await interaction.editReply({ content: reply });
      } catch (error) {
        console.error(
          `[ERROR] There was an error executing command ${interaction.commandName}:`,
          error
        );
        await interaction.editReply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } finally {
        await startLoop();
        start();
      }
    });

    client
      .login(process.env.TOKEN)
      .then(() => {
        console.log("Bot is logged in");
      })
      .catch((error) => {
        console.error("Failed to log in:", error);
      });

    async function storeJobs(jobArray) {
      console.log("Entered storeJobs function");

      const jobIds = jobArray.map((job) => job.id);
      console.log("Job IDs:", jobIds);

      let existingJobs;
      try {
        // Find existing jobs in the database with these IDs
        existingJobs = await jobstable.findAll({
          where: {
            id: jobIds,
          },
          attributes: ["id"],
        });
      } catch (error) {
        console.error("Error during ID check from database:", error.message);
        return [];
      }

      if (existingJobs.length === 0) {
        try {
          await jobstable.bulkCreate(jobArray);
          return jobArray;
        } catch (error) {
          console.error("Error during bulk creation:", error.message);
          return [];
        }
      }

      const existingJobIds = existingJobs.map((job) => job.id);
      const newJobs = jobArray.filter((job) => !existingJobIds.includes(job.id));

      if (newJobs.length > 0) {
        try {
          await jobstable.bulkCreate(newJobs);
          return newJobs;
        } catch (error) {
          console.error("Could not store jobs to database:", error.message);
          return [];
        }
      }

      return [];
    }

    async function getJobTitles(job) {
      console.log("entered getJobTitles");
      try {
        const newJobs = await page.evaluate((job,botFilterTime) => {

          function isJobWithinFilterTime(timeString, filterTimeMs) {
            if (!timeString) return false;
            
            const timeText = timeString.trim().toLowerCase();
            const currentTime = new Date();
            const filterTime = new Date(filterTimeMs);
            
            // For "Just now" or very recent posts
            if (timeText === "just now") {
              return true;
            }
            
            // Minutes ago
            if (timeText.includes("minutes ago") || timeText.includes("minute ago")) {
              const minutes = parseInt(timeText.split(" ")[0]);
              const minutesSinceFilter = (currentTime - filterTime) / (1000 * 60);
              return minutes < minutesSinceFilter;
            }
            
            // Hours ago
            if (timeText.includes("hours ago") || timeText.includes("hour ago")) {
              const hours = parseInt(timeText.split(" ")[0]);
              const hoursSinceFilter = (currentTime - filterTime) / (1000 * 60 * 60);
              return hours < hoursSinceFilter;
            }
            
            // Yesterday
            if (timeText.includes("yesterday")) {
              const daysSinceFilter = (currentTime - filterTime) / (1000 * 60 * 60 * 24);
              return daysSinceFilter > 1;
            }
            
            // Days ago
            if (timeText.includes("days ago") || timeText.includes("day ago")) {
              const days = parseInt(timeText.split(" ")[0]);
              const daysSinceFilter = (currentTime - filterTime) / (1000 * 60 * 60 * 24);
              return days < daysSinceFilter;
            }
            
            // Weeks ago
            if (timeText.includes("weeks ago") || timeText.includes("week ago")) {
              const weeks = parseInt(timeText.split(" ")[0]);
              const weeksSinceFilter = (currentTime - filterTime) / (1000 * 60 * 60 * 24 * 7);
              return weeks < weeksSinceFilter;
            }
            
            // Months ago
            if (timeText.includes("months ago") || timeText.includes("month ago")) {
              const months = parseInt(timeText.split(" ")[0]);
              const monthsSinceFilter = (currentTime - filterTime) / (1000 * 60 * 60 * 24 * 30); // Approximate
              return months < monthsSinceFilter;
            }
            
            // Handle "30+ days ago" type formats
            if (timeText.match(/\d+\+\s*days ago/)) {
              const daysText = timeText.split("+")[0].trim();
              const days = parseInt(daysText);
              const daysSinceFilter = (currentTime - filterTime) / (1000 * 60 * 60 * 24);
              return days < daysSinceFilter;
            }
            
            // Handle date formats like "Apr 10" or "March 15"
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            for (const month of monthNames) {
              if (timeText.includes(month)) {
                // Extract the day and month from the string
                const parts = timeText.split(" ");
                let monthIndex = -1;
                let day = -1;
                
                for (let i = 0; i < parts.length; i++) {
                  const normalizedPart = parts[i].toLowerCase().substring(0, 3);
                  const monthIdx = monthNames.indexOf(normalizedPart);
                  if (monthIdx !== -1) {
                    monthIndex = monthIdx;
                  }
                  
                  const possibleDay = parseInt(parts[i]);
                  if (!isNaN(possibleDay) && possibleDay > 0 && possibleDay <= 31) {
                    day = possibleDay;
                  }
                }
                
                if (monthIndex !== -1 && day !== -1) {
                  // Create date object for the job posting date
                  const jobYear = currentTime.getFullYear(); // Assume current year unless we know otherwise
                  const jobDate = new Date(jobYear, monthIndex, day);
                  
                  // If the resulting date is in the future, it's probably from last year
                  if (jobDate > currentTime) {
                    jobDate.setFullYear(jobYear - 1);
                  }
                  
                  // Check if this date is more recent than our filter time
                  return jobDate > filterTime;
                }
              }
            }
            
            // For any other format we don't recognize, default to excluding the job
            // to avoid missing potentially relevant posts
            return false;
          }

          const xpathResult = document.evaluate(
            "//section[@class='air3-card-section air3-card-hover p-4 px-2x px-md-4x']",
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );

          const allJobSections = [];
          const jobSections = [];

          for (let i = 0; i < xpathResult.snapshotLength; i++) {
            allJobSections.push(xpathResult.snapshotItem(i));
          }
          console.log("alljobsections", allJobSections);

          allJobSections.forEach((el) => {
            let checker = document.evaluate(
              ".//span[@data-test='posted-on']", // Use relative XPath
              el,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue?.textContent;
          
            if (!checker) return;
          
            const postTime = checker.trim();
            
            // Only include jobs that ARE within the filter time
            if(!isJobWithinFilterTime(postTime, botFilterTime)) return;
            
            jobSections.push(el);
          });
          console.log("jobSections: ", jobSections);
          if (jobSections.length === 0) return [];

          const jobsData = jobSections
            .map((element) => {
              const id = element.getAttribute("data-ev-opening_uid");

              const titleElement = document.evaluate(
                ".//a[@class='air3-link text-decoration-none' and @data-ev-label='link']", // Use relative XPath
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;

              let elstimatedBudget = null;
              let estimatedDuration = null;
              let weeklyHours = null;
              let isPaymentVerified = false;
              let rating = "not mentioned";
              let location = "not mentioned";

              // Getting posted time
              const postedOnElement = document.evaluate(
                ".//span[@data-test='posted-on']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              const postedOn = postedOnElement
                ? postedOnElement.textContent.trim()
                : null;

              // Getting job type
              const jobTypeElement = document.evaluate(
                ".//small/strong[@data-test='job-type']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              const jobType = jobTypeElement
                ? jobTypeElement.textContent.trim()
                : null;

              // Getting experience level
              const experienceLevelElement = document.evaluate(
                ".//span[@data-test='contractor-tier']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              const experienceLevel = experienceLevelElement
                ? experienceLevelElement.textContent.trim()
                : null;

              // Hourly Job Case: Getting estimated duration and weekly hours
              if (jobType && jobType.includes("Hourly")) {
                const durationElement = document.evaluate(
                  ".//span[@data-test='duration']",
                  element,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                ).singleNodeValue;

                if (durationElement) {
                  const durationText = durationElement.textContent.split(",");
                  estimatedDuration = durationText[0]
                    ? durationText[0].trim()
                    : null;
                  weeklyHours = durationText[1] ? durationText[1].trim() : null;
                }
              } else {
                // Fixed Job Type: Getting estimated budget
                const budgetElement = document.evaluate(
                  ".//span[@data-test='budget']",
                  element,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                ).singleNodeValue;
                elstimatedBudget = budgetElement
                  ? budgetElement.textContent.trim()
                  : null;
              }

              // Getting job description
              const jobDescriptionElement = document.evaluate(
                ".//span[@data-test='job-description-text']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              // const jobDescription = jobDescriptionElement
              //   ? jobDescriptionElement.textContent.trim()
              //   : null;
              const jobDescription = jobDescriptionElement
      ? (jobDescriptionElement.textContent.trim().length > 1200 
          ? jobDescriptionElement.textContent.trim().slice(0, 1200) + '...' 
          : jobDescriptionElement.textContent.trim())
      : "No description provided.";


              // Getting payment verification status
              const paymentStatusElement = document.evaluate(
                ".//small[@data-test='payment-verification-status']/strong",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;

              if (paymentStatusElement) {
                const paymentStatusText = paymentStatusElement.textContent.trim();
                isPaymentVerified = paymentStatusText.includes("Payment verified");
              }

                        // Getting rating
                        // const ratingElement = document.evaluate(
                        //   ".//span[@data-test='js-feedback']//span[@class='sr-only']",
                        //   element,
                        //   null,
                        //   XPathResult.FIRST_ORDERED_NODE_TYPE,
                        //   null
                        // ).singleNodeValue;
                        // if (ratingElement) {
                        //   const ratingText = ratingElement.textContent.split(" ")[2].trim();
                        //   rating = `${ratingText}/5`;
                        //   // if (ratingMatch) {
                        //   //   const ratingValue = ratingMatch[1]; // Get the first number (e.g., "5")
                        //   //   const ratingMax = ratingMatch[2]; // Get the second number (e.g., "5")
                        //   //   rating = `${ratingValue}/${ratingMax}`; // Format as "5/5"
                        //   // }
                        // }

              // Getting total spent
              const totalSpentElement = document.evaluate(
                ".//span[@data-test='formatted-amount']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              const totalSpent = totalSpentElement
                ? totalSpentElement.textContent.trim()
                : null;

              // Getting location (country)
              const countryElement = document.evaluate(
                ".//small[@data-test='client-country']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              location = countryElement
                ? countryElement.textContent.trim()
                : "not mentioned";

              // Getting number of proposals
              const proposalsElement = document.evaluate(
                ".//strong[@data-test='proposals']",
                element,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              ).singleNodeValue;
              const proposals = proposalsElement
                ? proposalsElement.textContent.trim()
                : null;

              if (id && titleElement) {
                const jobHref = titleElement.href.trim();
                const finalJobHref = jobHref.split("/?referrer_url_path=")[0];
                const title = titleElement.textContent.trim().toLowerCase();
                return {
                  id: id,
                  title: title,
                  jobHref: finalJobHref,
                  keywordId: job.id,
                  channelId: job.channelId,
                  postedOn: postedOn,
                  jobType: jobType,
                  experienceLevel: experienceLevel,
                  estimatedDuration: estimatedDuration,
                  weeklyHours: weeklyHours,
                  elstimatedBudget: elstimatedBudget,
                  jobDescription: jobDescription,
                  isPaymentVerified: isPaymentVerified,
                  totalSpent: totalSpent,
                  location: location,
                  proposals: proposals,
                };
              } else {
                console.log("Title element not found for element with ID: ", id);
              }
            })
            .filter(Boolean);

          return jobsData;
        }, job, BOT_FILTER_TIME.getTime());

        if (!newJobs || newJobs.length === 0) {
          console.log("No new jobs found");
          return [];
        }

        try {
          const jobs = await storeJobs(newJobs);
          return jobs;
        } catch (error) {
          console.log("Error storing jobs in getJobTitles: ", error.message);
          return [];
        }
      } catch (error) {
        console.error("Error in getJobTitles: ", error.message);
        return [];
      }
    }

    async function restart() {
      try {
        await stopLoop();
        await sleep(15000);
        await browser.close();
        await new Promise((resolve) => {
          setTimeout(
            resolve,
            Math.floor(Math.random() * (1200000 - 600000 + 1) + 600000)
          );
        });
      } catch (error) {
        console.error("error during restart: ", error.message);
      } finally {
        await startLoop();
        const result = await initialize();
        browser = result.browser;
        page = result.page;
        start();
      }
    }

    async function start() {
      const close = Math.floor(Math.random() * (600000 - 300000 + 1) + 300000);
      console.log("started fetching!");
      timeoutId = setTimeout(restart, close);
      try {
        let keywordsfrompage = await getkeywords(page);
        // console.log("keywords from homepage: ", keywordsfrompage);
        if (keywordsfrompage.length === 0) {
          console.log("no keywords!");
          return;
        }
        let keyword = await keywords.findAll({
          where: { dofetching: true },
        });
        // console.log("keywords from database: ", keyword);
        if (keyword.length === 0) {
          console.log("no active keyword in database!");
          return;
        }
        const keywordtoFetch = [];
        keyword.forEach((el) => {
          keywordtoFetch.push(el.keyword);
        });

        console.log("keywords to fetch: ", keywordtoFetch);
        jobs = [];
        elementsToClickOn = [];
        // console.error('entering loop');
        for (let i = 0; i < keywordsfrompage.length; i++) {
          // Extract text content directly in the browser context
          const textContent = await page.evaluate(
            (el) => el.textContent.trim().toLowerCase(),
            keywordsfrompage[i]
          );

          // console.log("heading: ", textContent);

          // Check if textContent matches any keyword in keywordtoFetch
          if (keywordtoFetch.includes(textContent)) {
            // console.log(`Match found for keyword: ${textContent}`);

            // Use page.evaluate() to get element properties
            const elementtextContent = await page.evaluate(
              (el) => el.textContent.trim().toLowerCase(), // Trim to avoid whitespace issues
              keywordsfrompage[i]
            );

            const job = await keywords.findOne({
              where: {
                keyword: elementtextContent,
              },
            });

            const k = {
              jobsName: job.keyword,
              id: job.id,
              channelId: job.ChannelId
            };
            jobs.push(k);
            elementsToClickOn.push(keywordsfrompage[i]);
            console.log(k, keywordsfrompage[i]);
          } else {
            console.log(`No match for: ${textContent}`);
          }
        }

        if (elementsToClickOn.length > 0) {
          while (await check()) {
            if (index >= elementsToClickOn.length) {
              index = 0;
            }

            await elementsToClickOn[index].click();
            await page.waitForSelector(
              "::-p-xpath(//section[@class='air3-card-section air3-card-hover p-4 px-2x px-md-4x'])",
              { timeout: 300000 }
            );
            await sleep(1000);
            console.log(`keyword name: ${jobs[index].jobsName}`);
            const jobTitles = await getJobTitles(jobs[index]);
            if (jobTitles.length === 0) {
              console.log("no new jobs");
            } else {
              const channel = client.channels.cache.get(jobTitles[0].channelId);
              jobTitles.forEach(async (element) => {
                let jobDescription = element.jobDescription || "No description provided.";

// Base message without the description
let baseMessage = `
🔍 **Keyword:** \`${jobs[index].jobsName}\`
💼 Position: ${element.title}
📅 Posted: ${element.postedOn || "Not mentioned"}
💵 Payment Type: ${element.jobType || "Not mentioned"}
💰 estimated budget: ${element.elstimatedBudget || "Not mentioned"}
📈 Experience Level: ${element.experienceLevel || "Not mentioned"}
⏲️ Estimated Duration: ${element.estimatedDuration || "Not mentioned"}
🕒 Weekly Hours: ${element.weeklyHours || "Not mentioned"}
🔗 Link: ${element.jobHref || "Not mentioned"}

📝 Position Overview:
`; // we'll append description next

const footer = `
📊 Client Info:

🔵 Payment Verified: ${element.isPaymentVerified ? "Yes" : "No"}
💰 Total Spent: ${element.totalSpent || "Not mentioned"}
🌍 Location: ${element.location || "Not mentioned"}
📋 Proposals: ${element.proposals || "Not mentioned"}
✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦
`;

// Combine parts to check length
const maxLength = 2000;
let availableLength = maxLength - (baseMessage.length + footer.length);

if (jobDescription.length > availableLength) {
  jobDescription = jobDescription.slice(0, availableLength - 3) + "...";
}

const finalMessage = baseMessage + jobDescription + footer;

await channel.send(finalMessage);

    //             await channel.send(`
    // 🔍 **Keyword:** \`${jobs[index].jobsName}\`
    // 💼 Position: ${element.title}
    // 📅 Posted: ${element.postedOn ? element.postedOn : "Not mentioned"}
    // 💵 Payment Type: ${element.jobType? element.jobType: "Not mentioned"}
    // 💰 estimated budget: ${element.elstimatedBudget? element.elstimatedBudget: "Not mentioned"}
    // 📈 Experience Level: ${element.experienceLevel? element.experienceLevel: "Not mentioned"}
    // ⏲️ Estimated Duration: ${element.estimatedDuration? element.estimatedDuration: "Not mentioned"}
    // 🕒 Weekly Hours: ${element.weeklyHours ? element.weeklyHours : "Not mentioned"}
    // 🔗 Link: ${element.jobHref ? element.jobHref : "Not mentioned"}
                
    // 📝 Position Overview:
    // ${element.jobDescription? element.jobDescription: "No description provided."}
                  
    // 📊 Client Info:
                  
    // 🔵 Payment Verified: ${element.isPaymentVerified ? "Yes" : "No"}
    // 💰 Total Spent: ${element.totalSpent ? element.totalSpent : "Not mentioned"}
    // 🌍 Location: ${element.location ? element.location : "Not mentioned"}
    // 📋 Proposals: ${element.proposals ? element.proposals : "Not mentioned"}
    // ✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦
    //                 `);
              });
              console.log(jobTitles, "\n");
            }
            index++;
            if (Math.random() < 0.5) {
              await scrollRandomly(page);
            }
            await sleep(Math.floor(Math.random() * (60000 - 30000 + 1) + 30000));
          }
        }
      } catch (error) {
        console.error("Error during fetching: ", error.message);
      }
      return;
    }


    
    try {
      const keys = await initialize();
      browser = keys.browser;
      page = keys.page;
      // interactionHandler(
      //   client,
      //   page,
      //   startLoop,
      //   stopLoop,
      //   sleep,
      //   keywords,
      //   timeoutId
      // );
      //to reload page after 30 minutes
      // setInterval(async () => {
      //   try {
      //     await reload(page, sleep, stopLoop, startLoop);
      //     start();
      //   } catch (error) {
      //     console.error("Error in reload:", error.message);
      //   }
      // }, 1800000);
      start();
    } catch (error) {
      console.log("error in initialize: ", error.message);
    }
