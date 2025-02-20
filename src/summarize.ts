import fs from "fs";
import path from "path";

const summarizeCanvasFingerprinters = (canvasPrints, fontPrints) => {
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

  for (const entry of files) {
    const entryPath = path.join(directory, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      const inspectionPath = path.join(entryPath, "inspection.json");

      if (fs.existsSync(inspectionPath)) {
        try {
          const inspection = JSON.parse(fs.readFileSync(inspectionPath, "utf8"));

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

        } catch (err: any) {
          console.log("error processing inspection!", err);
        }
      }
    }
  }
}

processDirectory("./outputs");
