import * as trackerRadarDomainCache from "../packages/blacklight-lambda/src-api-lambda/domain-cache";
import ObjectsToCsv from "objects-to-csv";
import fs from "fs";
import path from "path";
import reportedCardsData from "../packages/blacklight-lambda/src-api-lambda/reported-cards";
import { cardGroups } from '../packages/blacklight-lambda/src-cards-writer/index';
import { stripHtml } from "string-strip-html";

interface CardsSummary {
  url: string;
  ad_trackers_number: number;
  ad_trackers_owners: string; // list of tracker companies
  ad_trackers_statement: string; // e.g. 'this is more than the average of...'
  cookies_number: number;
  cookies_owners: string; // list of cookie companies
  cookies_statement: string; // e.g. 'this is more than the average of...'
  canvas_fingerprinting_found: string;
  canvas_fingerprinting_owners: string; // list of script owners
  session_recording_found: string;
  session_recording_owners: string; // list of script owners
  key_logging_found: string;
  key_logging_owners: string; // list of script owners
  pixel_found: string;
  google_remarketing_found: string;
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

// the number of data urls in a canvas fingerprint report
const canvasFingerprintDataUrlCount = (canvasPrints: any) => {
  if (Object.keys(canvasPrints.data_url).length > 0) {
    return Object.keys(canvasPrints.data_url).length;
  }
  return 0;
}

// the number of fingerprinters in a canvas fingerprint report
const canvasFingerprintersCount = (canvasPrints: any) => {
  if (canvasPrints.fingerprinters.length > 0) {
    return canvasPrints.fingerprinters.length;
  }
  return 0;
}

// the number of styles in a canvas fingerprint report
const canvasFingerprintStyleCount = (canvasPrints: any) => {
  if (Object.keys(canvasPrints.styles).length > 0) {
    return Object.keys(canvasPrints.styles).length;
  }
  return 0;
}

// the number of texts in a canvas fingerprint report
const canvasFingerprintTextCount = (canvasPrints: any) => {
  if (Object.keys(canvasPrints.texts).length > 0) {
    return Object.keys(canvasPrints.texts).length;
  }
  return 0;
}

// the number of fonts in a canvas font fingerprint report
const fontFingerprintCanvasFontCount = (fontPrints: any) => {
  if (Object.keys(fontPrints.canvas_font).length > 0) {
    return Object.keys(fontPrints.canvas_font).length;
  }
  return 0;
}

// the number of text measures in a canvas font fingerprint report
const fontFingerprintTextMeasureCount = (fontPrints: any) => {
  if (Object.keys(fontPrints.text_measure).length > 0) {
    return Object.keys(fontPrints.text_measure).length;
  }
  return 0;
}

// a comma-separated list of key logging event names
const keyLoggingEvents = (events: any) => {
  if (Object.keys(events).length > 0) {
    return Object.keys(events).join(", ");
  }
  return "";
}

// a comma-separated list of session recorder event names
const sessionRecorderEvents = (events: any) => {
  if (Object.keys(events).length > 0) {
    return Object.keys(events).join(", ");
  }
  return "";
}

// summarize the contents of canvas and font fingerprint reports
const summarizeCanvasFingerprinters = (canvasPrints: any, fontPrints: any) => {
  if (Object.keys(canvasPrints.data_url).length > 0) {
    console.log(`> canvas fingerprinters: ${Object.keys(canvasPrints.data_url).length} data url(s)`);
  }

  if (canvasPrints.fingerprinters.length > 0) {
    console.log(`> fingerprinters: ${canvasPrints.fingerprinters.length} url(s)`);
  }

  if (Object.keys(canvasPrints.styles).length > 0) {
    console.log(`> styles: ${Object.keys(canvasPrints.styles).length} url(s)`);
  }

  if (Object.keys(canvasPrints.texts).length > 0) {
    console.log(`> texts: ${Object.keys(canvasPrints.texts).length} url(s)`);
  }


  if (Object.keys(fontPrints.canvas_font).length > 0) {
    console.log(`> canvas fonts: ${Object.keys(fontPrints.canvas_font).length} url(s)`);
  }

  if (Object.keys(fontPrints.text_measure).length > 0) {
    console.log(`> text measures: ${Object.keys(fontPrints.text_measure).length} url(s)`);
  }
}

// Read all JSON files and process each listing
const processDirectory = async (directory: string) => {
  const files = fs.readdirSync(directory);
  const cardsSummaries: CardsSummary[] = [];

  for (const entry of files) {
    const entryPath = path.join(directory, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      const inspectionPath = path.join(entryPath, "inspection.json");

      if (fs.existsSync(inspectionPath)) {
        try {
          const inspection = JSON.parse(fs.readFileSync(inspectionPath, "utf8"));

          const cardsData: any[] = reportedCardsData;
          const domainCache: any = trackerRadarDomainCache;
          const { groups } = await cardGroups(inspection, inspectionPath, domainCache, cardsData);

          const inspectionResult: any = groups.find((item: any) => item.title === 'Blacklight Inspection Result');
          const adTrackersCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'ddg_join_ads');
          const cookiesCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'cookies');
          const fingerprintingCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'canvas_fingerprinters');
          const sessionRecordersCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'session_recorders');
          const keyLoggingCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'key_logging');
          const pixelCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'fb_pixel_events');
          const analyticsCard: any = inspectionResult.cards.find((item: any) => item.cardType === 'ga');

          const someAdTechCompanies: any = groups.find((item) => item.title === 'Some of the ad-tech companies this website interacted with:');

          const cardsSummary: CardsSummary = {
            url: inspection.uri_ins,
            ad_trackers_number: adTrackersCard?.bigNumber || 0,
            ad_trackers_owners: adTrackersCard?.domainData?.owners?.join(", ") || "",
            ad_trackers_statement: stripHtml(adTrackersCard?.onAvgStatement || "").result,
            cookies_number: cookiesCard?.bigNumber || 0,
            cookies_owners: cookiesCard?.domainData?.owners?.join(", ") || "",
            cookies_statement: stripHtml(cookiesCard?.onAvgStatement || "").result,
            canvas_fingerprinting_found: fingerprintingCard?.testEventsFound ? "true" : "false",
            canvas_fingerprinting_owners: fingerprintingCard?.domainData?.owners?.join(", ") || "",
            session_recording_found: sessionRecordersCard?.testEventsFound ? "true" : "false",
            session_recording_owners: sessionRecordersCard?.domainData?.owners?.join(", ") || "",
            key_logging_found: keyLoggingCard?.testEventsFound ? "true" : "false",
            key_logging_owners: keyLoggingCard?.domainData?.owners?.join(", ") || "",
            pixel_found: pixelCard?.testEventsFound ? "true" : "false",
            google_remarketing_found: analyticsCard?.testEventsFound ? "true" : "false",
            ad_tech_companies: someAdTechCompanies?.cards?.map((item: any) => item.title)?.join(", ") || "",
          }
          cardsSummaries.push(cardsSummary);

          // summarize findings to the console
          let cardContent = "-----------------------------------------------";
          // the URL of the site
          cardContent = `${cardContent}\n${inspection.uri_ins}\n`;
          // ad trackers
          let adTrackersPrefix = "[ ] ";
          if (cardsSummary.ad_trackers_number > 0) {
            adTrackersPrefix = `[X] ${cardsSummary.ad_trackers_number} `;
          }
          cardContent = `${cardContent}\n${adTrackersPrefix}${adTrackersCard.title} - ${cardsSummary.ad_trackers_statement}`;
          if (cardsSummary.ad_trackers_owners !== "") {
            cardContent = `${cardContent}\nScripts detected belonging to: ${cardsSummary.ad_trackers_owners}`;
          }
          // third-party cookies
          let cookiePrefix = "[ ] ";
          if (cardsSummary.cookies_number > 0) {
            cookiePrefix = `[X] ${cardsSummary.cookies_number} `;
          }
          cardContent = `${cardContent}\n\n${cookiePrefix}${cookiesCard.title} - ${cardsSummary.cookies_statement}`;
          if (cardsSummary.cookies_owners !== "") {
            cardContent = `${cardContent}\nCookies detected set for: ${cardsSummary.cookies_owners}`;
          }
          // fingerprinting
          if (cardsSummary.canvas_fingerprinting_found === "true") {
            cardContent = `${cardContent}\n\n[X] Canvas fingerprinting was detected on this website.`;
            if (cardsSummary.canvas_fingerprinting_owners !== "") {
              cardContent = `${cardContent}\nScripts detected belonging to: ${cardsSummary.canvas_fingerprinting_owners}`;
            }
          } else {
            cardContent = `${cardContent}\n\n[ ] Canvas fingerprinting was not detected on this website.`;
          }
          // session recording
          if (cardsSummary.session_recording_found === "true") {
            cardContent = `${cardContent}\n\n[X] Blacklight detected the use of a session recorder.`;
            cardContent = `${cardContent}\nScripts detected belonging to: ${cardsSummary.session_recording_owners}`;
          } else {
            cardContent = `${cardContent}\n\n[ ] Blacklight did not detect the use of a session recorder.`;
          }
          // key logging
          if (cardsSummary.key_logging_found === "true") {
            cardContent = `${cardContent}\n\n[X] ${keyLoggingCard.title}`;
            cardContent = `${cardContent}\nScripts detected belonging to: ${cardsSummary.key_logging_owners}`;
          } else {
            cardContent = `${cardContent}\n\n[ ] ${keyLoggingCard.title}`;
          }
          // meta pixel
          if (cardsSummary.pixel_found === "true") {
            cardContent = `${cardContent}\n\n[X] ${pixelCard.title}`;
          } else {
            cardContent = `${cardContent}\n\n[ ] ${pixelCard.title}`;
          }
          // google analytics remarketing
          if (cardsSummary.google_remarketing_found === "true") {
            cardContent = `${cardContent}\n\n[X] ${analyticsCard.title}`;
          } else {
            cardContent = `${cardContent}\n\n[ ] ${analyticsCard.title}`;
          }
          // ad tech companies this site interacted with
          if (cardsSummary.ad_tech_companies !== "") {
            cardContent = `${cardContent}\n\n${someAdTechCompanies.title}`;
            cardContent = `${cardContent}\n${cardsSummary.ad_tech_companies}`;
          }
          console.log(`${cardContent}\n`);

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
