import fs from "fs";
import path from "path";
import ObjectsToCsv from "objects-to-csv";
import { cardGroups } from '../packages/blacklight-lambda/src-cards-writer/index';
import * as trackerRadarDomainCache from '../packages/blacklight-lambda/src-api-lambda/domain-cache';
import * as reportedCardsData from '../packages/blacklight-lambda/src-api-lambda/reported-cards';

interface QuerySummary {
  url: string;
  behavior_event_listeners: string;
  canvas_fingerprint_data_url_count: number;
  canvas_fingerprinters_count: number;
  canvas_fingerprint_style_count: number;
  canvas_fingerprint_text_count: number;
  font_fingerprint_canvas_font_count: number;
  font_fingerprint_text_measure_count: number;
  cookies_count: number;
  fb_pixel_events_count: number;
  key_logging_events: string;
  session_recorder_events: string;
  third_party_trackers_count: number;
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
  const summaries: QuerySummary[] = [];

  for (const entry of files) {
    const entryPath = path.join(directory, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      const inspectionPath = path.join(entryPath, "inspection.json");

      if (fs.existsSync(inspectionPath)) {
        try {
          const inspection = JSON.parse(fs.readFileSync(inspectionPath, "utf8"));

          const summary: QuerySummary = {
            url: inspection.uri_ins,
            behavior_event_listeners: Object.keys(inspection.reports.behaviour_event_listeners).join(", "),
            canvas_fingerprint_data_url_count: canvasFingerprintDataUrlCount(inspection.reports.canvas_fingerprinters),
            canvas_fingerprinters_count: canvasFingerprintersCount(inspection.reports.canvas_fingerprinters),
            canvas_fingerprint_style_count: canvasFingerprintStyleCount(inspection.reports.canvas_fingerprinters),
            canvas_fingerprint_text_count: canvasFingerprintTextCount(inspection.reports.canvas_fingerprinters),
            font_fingerprint_canvas_font_count: fontFingerprintCanvasFontCount(inspection.reports.canvas_font_fingerprinters),
            font_fingerprint_text_measure_count: fontFingerprintTextMeasureCount(inspection.reports.canvas_font_fingerprinters),
            cookies_count: inspection.reports.cookies.length,
            fb_pixel_events_count: inspection.reports.fb_pixel_events.length,
            key_logging_events: keyLoggingEvents(inspection.reports.key_logging),
            session_recorder_events: sessionRecorderEvents(inspection.reports.session_recorders),
            third_party_trackers_count: inspection.reports.third_party_trackers.length,
          }
          summaries.push(summary);

          // summarize contents of inspection.json
          console.log("------------------");
          // the URL of the site
          console.log(`> URL: ${inspection.uri_ins}`);
          // behavior event listeners
          if (Object.keys(inspection.reports.behaviour_event_listeners).length > 0) {
            console.log(`> found behavior event listeners: ${Object.keys(inspection.reports.behaviour_event_listeners).join(", ")}`);
          }
          // canvas fingerprinters & font fingerprinters
          summarizeCanvasFingerprinters(inspection.reports.canvas_fingerprinters, inspection.reports.canvas_font_fingerprinters);
          // cookies
          console.log(`> ${inspection.reports.cookies.length} cookies!`);
          // meta pixel events
          console.log(`> ${inspection.reports.fb_pixel_events.length} meta pixel events!`);
          // key logging
          if (Object.keys(inspection.reports.key_logging).length > 0) {
            console.log(`> found key logging: ${Object.keys(inspection.reports.key_logging).join(", ")}`);
          }
          // session recorders
          if (Object.keys(inspection.reports.session_recorders).length > 0) {
            console.log(`> found session recorders: ${Object.keys(inspection.reports.session_recorders).join(", ")}`);
          }
          // third party trackers
          console.log(`> ${inspection.reports.third_party_trackers.length} third party tracker events!`);
          console.log("------------------");

          const cardsData: any[] = reportedCardsData.default;
          const domainCache: any = trackerRadarDomainCache;
          const { groups } = await cardGroups(inspection, inspectionPath, domainCache, cardsData);
          console.log('groups is: ', JSON.stringify(groups));

        } catch (err: any) {
          console.log("error processing inspection!", err);
        }
      } else {
        console.log(`** NO inspection.json found at ${inspectionPath}!`);
      }
    }
  }


  // write to csv
  const summaryPath: string = `./${timestamp()}-summary.csv`;
  const csv = new ObjectsToCsv(summaries);
  await csv.toDisk(summaryPath);
  console.log(`> summary written to ${summaryPath}`);
}

processDirectory("./testing");
