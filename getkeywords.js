export default async function getkeywords(page) {
  const keywords = await page.$$(
    "div.air3-token-container.saved-search-list > div > a"
  );
  return keywords;
}