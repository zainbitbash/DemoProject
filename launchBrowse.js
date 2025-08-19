import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import sleep from "./sleep.js";
import Cookies from "./cookies.js";

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function initialize() {
  let browser;
  let page;
  try {
     browser = await puppeteer.launch({
      headless: false,
      args: ["--start-maximized"],
      defaultViewport: null,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      userDataDir: "C:/Users/Bitbash/AppData/Local/Google/Chrome/User Data/Default"
      // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      // userDataDir:
      //   "C:/Users/Abdullah/AppData/Local/Google/Chrome/User Data/Profile 2",
      // "C:/Users/Abdullah/AppData/Local/Google/Chrome/User Data/Default"
    });
    page = await browser.newPage();
    await page.setCookie(...Cookies);
    await sleep(5000);
    await page.goto("https://www.upwork.com/nx/find-work/", {
      waitUntil: "networkidle0",
    });
    const google = await page.waitForSelector(
      '::-p-xpath(//button[span[text()="Continue with Google"]])',
      { timeout: 10000 }
    );
    await google.click();
    await sleep(15000);
    
    const input = await page.waitForSelector(
      '::-p-xpath(//input[@type="password" and contains(@class, "air3-input")])',
      { timeout: 10000 }
    );
    await input.focus();
    await input.type("iqbal");
    await page.keyboard.press("Enter");
  } catch (error) {
    console.error('error in initialization', error.message);
  } finally{
    await sleep(5000);
    return {
      browser: browser,
      page: page,
    };
  }
  
}
export default initialize;
