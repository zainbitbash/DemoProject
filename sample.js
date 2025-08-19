async function getJobTitles(job) {
    console.log("entered getJobTitles");
    try {
      const newJobs = await page.evaluate((job) => {
        const xpathResult = document.evaluate(
          "//section[@class='air3-card-section air3-card-hover p-4 px-2x px-md-4x']",
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        console.log("jobs result:",xpathResult.snapshotLength);

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

          // console.log("checker", checker);
          const postTime = checker.trim();
          const time = postTime.split(" ");
          // console.log(postTime);
          const num = parseInt(time[0]);
          // console.log(num, time);
          if (time[1] !== "minutes" || num > 30) return; // Use `num` instead of `time[0]`
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
              const title = titleElement.textContent.trim().toLowerCase();
              return {
                id: id,
                title: title,
                jobHref: jobHref,
                keywordId: job.id,
                channelId: job.ChannelId,
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
      }, job);

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