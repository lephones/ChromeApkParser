import { execSync } from "child_process";
import path from "path";

const svgPath = path.resolve("icons/icon.svg");
const p128 = path.resolve("icons/icon128.png");
const p48 = path.resolve("icons/icon48.png");
const p16 = path.resolve("icons/icon16.png");

console.log("Generating extension icons from icons/icon.svg...");
execSync(`sips -s format png "${svgPath}" --out "${p128}"`);
execSync(`sips -z 48 48 "${p128}" --out "${p48}"`);
execSync(`sips -z 16 16 "${p128}" --out "${p16}"`);

console.log("✅ Successfully generated icon128.png, icon48.png, icon16.png!");
