// One-shot QR for the card footer. The URL is static → generate once, commit
// the SVG, zero runtime deps. Re-run only if the production domain changes.
// Usage: node scripts/gen-start-qr.mjs https://<production-domain>/start
import QRCode from "qrcode";
import fs from "node:fs";

const url = process.argv[2];
if (!url) { console.error("usage: node scripts/gen-start-qr.mjs <url>"); process.exit(1); }
const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#180626", light: "#ffffff" } });
fs.writeFileSync("public/qr-start.svg", svg);
console.log("wrote public/qr-start.svg →", url);
