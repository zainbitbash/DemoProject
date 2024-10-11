export default async function reload(page, sleep,stoploop, startloop) {
    const url = await page.url();
  try {
    if (url.includes("https://www.upwork.com/nx/find-work/")) {
        await stoploop();
        await sleep(4000)
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      await page.waitForSelector(
        "::-p-xpath(//input[@type='search' and @placeholder='Search for jobs'])",
        { timeout: 120000 }
      );
      await sleep(4000);
      await startloop();
    } else {
      return;
    }
  } catch (error) {
    await page.goto("https://www.upwork.com/nx/find-work/");
    await page.waitForSelector(
      "::-p-xpath(//input[@type='search' and @placeholder='Search for jobs'])",
      { timeout: 120000 }
    );
    await sleep(1000);
    await startloop();
  }
}