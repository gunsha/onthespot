import fs from 'fs';
import { JSDOM } from "jsdom";

const html = fs.readFileSync('src/onthespot/resources/web/settings.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

const twindSrc = fs.readFileSync('src/onthespot/resources/web/twind.js', 'utf8');
const twindSetupSrc = fs.readFileSync('src/onthespot/resources/web/twind-setup.js', 'utf8');

try {
  dom.window.eval(twindSrc);
  dom.window.eval(twindSetupSrc);
  console.log("Twind initialized without throwing!");
} catch (e) {
  console.error("Twind init error:", e);
}
