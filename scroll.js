
async function sleep(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}


  const smoothScroll = async (start, end, duration,page) => {
    try {
      await page.evaluate((start, end, duration) => {
        return new Promise(resolve => {
          const startTime = performance.now();
  
          function scroll() {
            const now = performance.now();
            const progress = Math.min((now - startTime) / duration, 1);
            window.scrollTo(0, start + (end - start) * easeInOutQuad(progress));
  
            if (progress < 1) {
              requestAnimationFrame(scroll);
            } else {
              resolve();
            }
          }
  
          function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }
  
          scroll();
        });
      }, start, end, duration);
    } catch (error) {
      console.error('error in smoothScroll: ', error.message);
      throw new Error(error.message);
    }
    
  };

  export default async function scrollRandomly(page){
    try {
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    await smoothScroll(
      await page.evaluate(() => window.scrollY),
      await page.evaluate(() => window.scrollY) + Math.random() * (scrollHeight / 4),
      2000,
      page
    );
    await sleep(Math.floor(Math.random() * (2000-1000 + 1) + 1000));

    await smoothScroll(
      await page.evaluate(() => window.scrollY),
      await page.evaluate(() => window.scrollY) + Math.random() * (scrollHeight / 2),
      2000,
      page
    );
    await sleep(Math.floor(Math.random() * (2000-1000 + 1) + 1000));

    await smoothScroll(
      await page.evaluate(() => window.scrollY),
      scrollHeight - viewportHeight,
      3000,
      page
    );
    await sleep(Math.floor(Math.random() * (2000-1000 + 1) + 1000));

    await smoothScroll(
      await page.evaluate(() => window.scrollY),
      Math.max(0, await page.evaluate(() => window.scrollY) - Math.random() * (scrollHeight / 2)),
      2000,
      page
    );
    await sleep(Math.floor(Math.random() * (2000-1000 + 1) + 1000));

    await smoothScroll(
      await page.evaluate(() => window.scrollY),
      0,
      3000,
      page
    );
    await sleep(Math.floor(Math.random() * (2000-1000 + 1) + 1000));
    return;
    } catch (error) {
      console.error('error in  scrollRandomly:', error.message);
      return;
    }
  };

 