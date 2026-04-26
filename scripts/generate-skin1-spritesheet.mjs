import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const baseDir = path.join(
  projectRoot,
  "public",
  "assests",
  "skins",
  "skin-1-animations"
);

const directions = [
  { key: "S", name: "Down", folder: "S-animation" },
  { key: "A", name: "Left", folder: "A-animation" },
  { key: "D", name: "Right", folder: "D-animataion" },
  { key: "W", name: "Up", folder: "W-animation" },
];

const frameCount = 4;

const sortByFrameIndex = (files) =>
  files
    .filter((file) => file.endsWith(".png"))
    .sort((a, b) => {
      const matchA = a.match(/mov(\d+)/i);
      const matchB = b.match(/mov(\d+)/i);
      const indexA = matchA ? Number(matchA[1]) : 0;
      const indexB = matchB ? Number(matchB[1]) : 0;
      return indexA - indexB;
    });

const normalizeFrames = (files) => {
  if (!files.length) return [];
  const frames = files.slice(0, frameCount);
  while (frames.length < frameCount) {
    frames.push(frames[frames.length - 1]);
  }
  return frames;
};

const loadFramePaths = async () => {
  const entries = await Promise.all(
    directions.map(async (direction) => {
      const dirPath = path.join(baseDir, direction.folder);
      const files = await fs.readdir(dirPath);
      const ordered = normalizeFrames(sortByFrameIndex(files));
      if (!ordered.length) {
        throw new Error(`No frames found in ${direction.folder}`);
      }
      return {
        ...direction,
        dirPath,
        frames: ordered.map((file) => path.join(dirPath, file)),
      };
    })
  );

  return entries;
};

const generateSpriteSheet = async () => {
  const rows = await loadFramePaths();
  const firstFrame = rows[0].frames[0];
  const metadata = await sharp(firstFrame).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read frame dimensions.");
  }

  const frameWidth = metadata.width;
  const frameHeight = metadata.height;
  const sheetWidth = frameWidth * frameCount;
  const sheetHeight = frameHeight * rows.length;

  const composite = rows.flatMap((row, rowIndex) =>
    row.frames.map((frame, colIndex) => ({
      input: frame,
      left: colIndex * frameWidth,
      top: rowIndex * frameHeight,
    }))
  );

  const sheet = sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(composite);

  const outputPng = path.join(
    projectRoot,
    "public",
    "assests",
    "skins",
    "skin-1-spritesheet.png"
  );
  const outputJson = path.join(
    projectRoot,
    "public",
    "assests",
    "skins",
    "skin-1-spritesheet.json"
  );

  await sheet.png().toFile(outputPng);

  const framesMeta = rows.flatMap((row, rowIndex) =>
    row.frames.map((frame, colIndex) => ({
      direction: row.key,
      directionName: row.name,
      frame: colIndex,
      x: colIndex * frameWidth,
      y: rowIndex * frameHeight,
      width: frameWidth,
      height: frameHeight,
      source: path.relative(projectRoot, frame),
    }))
  );

  const spriteMeta = {
    sheet: {
      src: "/assests/skins/skin-1-spritesheet.png",
      width: sheetWidth,
      height: sheetHeight,
      columns: frameCount,
      rows: rows.length,
      frameWidth,
      frameHeight,
    },
    directions: rows.map((row, index) => ({
      key: row.key,
      name: row.name,
      row: index,
      frames: Array.from({ length: frameCount }, (_, i) => i),
    })),
    frames: framesMeta,
  };

  await fs.writeFile(outputJson, JSON.stringify(spriteMeta, null, 2));

  console.log(`Sprite sheet written to ${outputPng}`);
  console.log(`Metadata written to ${outputJson}`);
};

generateSpriteSheet().catch((error) => {
  console.error(error);
  process.exit(1);
});
