import * as trackerRadarDomainCache from "../packages/blacklight-lambda/src-api-lambda/domain-cache";
import ObjectsToCsv from "objects-to-csv";
import fs from "fs";
import path from "path";
import reportedCardsData from "../packages/blacklight-lambda/src-api-lambda/reported-cards";
import { cardGroups } from "../packages/blacklight-lambda/src-cards-writer/index";
import { stripHtml } from "string-strip-html";

interface CardsSummary {
  host: string;
  pages_number: number;
  url: string;
  additional_urls: string;
  ad_trackers_number: number;
  ad_trackers_owners: string; // list of tracker companies
  ad_trackers_statement: string; // e.g. "this is more than the average of..."
  cookies_number: number;
  cookies_owners: string; // list of cookie companies
  cookies_statement: string; // e.g. "this is more than the average of..."
  canvas_fingerprinting_found: "true" | "false";
  canvas_fingerprinting_owners: string; // list of script owners
  session_recording_found: "true" | "false";
  session_recording_owners: string; // list of script owners
  key_logging_found: "true" | "false";
  key_logging_owners: string; // list of script owners
  pixel_found: "true" | "false";
  google_remarketing_found: "true" | "false";
  ad_tech_companies_number: number;
  ad_tech_companies: string; // list of ad-tech companies interacted with
}

// get the current date & time as an ISO string
const nowISOString = () => {
  const now = new Date();
  return now.toISOString();
}

// get a timestamp in the format "YYYYMMDD-HHMMSS"
const timestamp = () => {
  const split = nowISOString().split("T");
  const dateString = split[0].replace(/-/g, "");
  const timeString = split[1].split(".")[0].replace(/:/g, "");
  return `${dateString}-${timeString}`;
}

// iterate over directories and process contained `inspection.json` files
const processDirectory = async (directory: string) => {
  // data from blacklight lambda
  const cardsData: any[] = reportedCardsData;
  const domainCache: any = trackerRadarDomainCache;
  // the summaries we'll write to CSV
  const cardsSummaries: CardsSummary[] = [];
  // the files we'll be navigating
  const files = fs.readdirSync(directory);

  // step through the files
  for (const entry of files) {
    const entryPath = path.join(directory, entry);
    const stats = fs.statSync(entryPath);

    // if the file is a directory
    if (stats.isDirectory()) {
      // check for an `inspection.json` file and process it if it exists
      const inspectionPath = path.join(entryPath, "inspection.json");
      if (fs.existsSync(inspectionPath)) {
        try {
          const inspection = JSON.parse(fs.readFileSync(inspectionPath, "utf8"));

          const { groups } = await cardGroups(inspection, inspectionPath, domainCache, cardsData);

          // write the analysis to a file in the target directory
          // the file will be overwritten/replaced each time this script is run
          const groupsPath: string = path.join(entryPath, `blacklight-inspection-result.json`)
          fs.writeFileSync(groupsPath, JSON.stringify(groups, null, 2));

          const inspectionResult: any = groups.find((item: any) => item.title === "Blacklight Inspection Result");
          const adTrackersCard: any = inspectionResult.cards.find((item: any) => item.cardType === "ddg_join_ads");
          const cookiesCard: any = inspectionResult.cards.find((item: any) => item.cardType === "cookies");
          const fingerprintingCard: any = inspectionResult.cards.find((item: any) => item.cardType === "canvas_fingerprinters");
          const sessionRecordersCard: any = inspectionResult.cards.find((item: any) => item.cardType === "session_recorders");
          const keyLoggingCard: any = inspectionResult.cards.find((item: any) => item.cardType === "key_logging");
          const pixelCard: any = inspectionResult.cards.find((item: any) => item.cardType === "fb_pixel_events");
          const analyticsCard: any = inspectionResult.cards.find((item: any) => item.cardType === "ga");

          const someAdTechCompanies: any = groups.find((item) => item.title === "Some of the ad-tech companies this website interacted with:");

          const cardsSummary: CardsSummary = {
            host: inspection.host,
            pages_number: inspection.config.numPages + 1,
            url: inspection.uri_ins,
            additional_urls: inspection.browsing_history.slice(1).join("; "),
            ad_trackers_number: adTrackersCard?.bigNumber || 0,
            ad_trackers_owners: adTrackersCard?.domainData?.owners?.join("; ") || "",
            ad_trackers_statement: stripHtml(adTrackersCard?.onAvgStatement || "").result,
            cookies_number: cookiesCard?.bigNumber || 0,
            cookies_owners: cookiesCard?.domainData?.owners?.join("; ") || "",
            cookies_statement: stripHtml(cookiesCard?.onAvgStatement || "").result,
            canvas_fingerprinting_found: fingerprintingCard?.testEventsFound ? "true" : "false",
            canvas_fingerprinting_owners: fingerprintingCard?.domainData?.owners?.join("; ") || "",
            session_recording_found: sessionRecordersCard?.testEventsFound ? "true" : "false",
            session_recording_owners: sessionRecordersCard?.domainData?.owners?.join("; ") || "",
            key_logging_found: keyLoggingCard?.testEventsFound ? "true" : "false",
            key_logging_owners: keyLoggingCard?.domainData?.owners?.join("; ") || "",
            pixel_found: pixelCard?.testEventsFound ? "true" : "false",
            google_remarketing_found: analyticsCard?.testEventsFound ? "true" : "false",
            ad_tech_companies_number: someAdTechCompanies?.cards?.length || 0,
            ad_tech_companies: someAdTechCompanies?.cards?.map((item: any) => item.title)?.join("; ") || "",
          }
          cardsSummaries.push(cardsSummary);

          // summarize findings to the console
          const cardContentLines: string[] = [];
          cardContentLines.push("-----------------------------------------------");
          // the URL of the site
          cardContentLines.push(
            `Scanned ${cardsSummary.host}, ${cardsSummary.pages_number} page(s):`
          );
          cardContentLines.push(`${inspection.browsing_history.join("\n")}\n`);
          // ad trackers
          let adTrackersPrefix = "[ ] ";
          if (cardsSummary.ad_trackers_number > 0) {
            adTrackersPrefix = `[X] ${cardsSummary.ad_trackers_number} `;
          }
          cardContentLines.push(
            `${adTrackersPrefix}${adTrackersCard.title} - ${cardsSummary.ad_trackers_statement}`
          );
          if (cardsSummary.ad_trackers_owners !== "") {
            cardContentLines.push(
              `Scripts detected belonging to: ${cardsSummary.ad_trackers_owners}`
            );
          }
          // third-party cookies
          let cookiePrefix = "[ ] ";
          if (cardsSummary.cookies_number > 0) {
            cookiePrefix = `[X] ${cardsSummary.cookies_number} `;
          }
          cardContentLines.push(
            `\n${cookiePrefix}${cookiesCard.title} - ${cardsSummary.cookies_statement}`
          );
          if (cardsSummary.cookies_owners !== "") {
            cardContentLines.push(`Cookies detected set for: ${cardsSummary.cookies_owners}`);
          }
          // fingerprinting
          if (cardsSummary.canvas_fingerprinting_found === "true") {
            cardContentLines.push(`\n[X] Canvas fingerprinting was detected on this website.`);
            if (cardsSummary.canvas_fingerprinting_owners !== "") {
              cardContentLines.push(
                `Scripts detected belonging to: ${cardsSummary.canvas_fingerprinting_owners}`
              );
            }
          } else {
            cardContentLines.push(`\n[ ] Canvas fingerprinting was not detected on this website.`);
          }
          // session recording
          if (cardsSummary.session_recording_found === "true") {
            cardContentLines.push(`\n[X] Blacklight detected the use of a session recorder.`);
            cardContentLines.push(
              `Scripts detected belonging to: ${cardsSummary.session_recording_owners}`
            );
          } else {
            cardContentLines.push(`\n[ ] Blacklight did not detect the use of a session recorder.`);
          }
          // key logging
          if (cardsSummary.key_logging_found === "true") {
            cardContentLines.push(`\n[X] ${keyLoggingCard.title}`);
            cardContentLines.push(
              `Scripts detected belonging to: ${cardsSummary.key_logging_owners}`
            );
          } else {
            cardContentLines.push(`\n[ ] ${keyLoggingCard.title}`);
          }
          // meta pixel
          if (cardsSummary.pixel_found === "true") {
            cardContentLines.push(`\n[X] ${pixelCard.title}`);
          } else {
            cardContentLines.push(`\n[ ] ${pixelCard.title}`);
          }
          // google analytics remarketing
          if (cardsSummary.google_remarketing_found === "true") {
            cardContentLines.push(`\n[X] ${analyticsCard.title}`);
          } else {
            cardContentLines.push(`\n[ ] ${analyticsCard.title}`);
          }
          // ad tech companies this site interacted with
          if (cardsSummary.ad_tech_companies !== "") {
            cardContentLines.push(`\n${someAdTechCompanies.title}`);
            cardContentLines.push(`${cardsSummary.ad_tech_companies}`);
          }
          console.log(`${cardContentLines.join("\n")}\n`);

        } catch (err: any) {
          console.log("error processing inspection!", err);
        }
      } else {
        console.log(`** NO inspection.json found at ${inspectionPath}!`);
      }
    }
  }

  // write to csv
  const cardsSummaryPath: string = `./${timestamp()}-cards-summary.csv`;
  const cardsCSV = new ObjectsToCsv(cardsSummaries);
  await cardsCSV.toDisk(cardsSummaryPath);
  console.log(`> cards summary written to ${cardsSummaryPath}`);
}

processDirectory("./outputs");
