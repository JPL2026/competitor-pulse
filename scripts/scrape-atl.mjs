// GitHub Actions daily scrape runner — calls the shared core and prints the report.
import { runScrape } from './scrape-core.mjs';

const report = await runScrape();
console.log(JSON.stringify(report, null, 1));
