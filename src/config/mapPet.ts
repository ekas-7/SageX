/**
 * Mecha-pet companion on the world map (4×4 spritesheet).
 * Source: public/assests/skins/petspritesheet.png — 2752×1536 → 688×384 per cell.
 */
export const MAP_PET_SHEET = "/assests/skins/petspritesheet.png";
export const MAP_PET_FRAMES = 4;
export const MAP_PET_DIRECTION_ROWS = 4;

/** Source pixels per cell (for documentation / future tooling). */
export const MAP_PET_SOURCE_CELL_W = 2752 / MAP_PET_FRAMES;
export const MAP_PET_SOURCE_CELL_H = 1536 / MAP_PET_DIRECTION_ROWS;

/**
 * Display width in CSS px; height follows the 688:384 cell aspect.
 */
export const MAP_PET_BASE_WIDTH = 48;

export function mapPetDisplayHeight(displayWidth: number): number {
  return Math.round((displayWidth * MAP_PET_SOURCE_CELL_H) / MAP_PET_SOURCE_CELL_W);
}

/**
 * How far behind the player the pet sits per facing (map pixels, before global offset).
 */
export const MAP_PET_FOLLOW_GAP_PX = 24;

/**
 * Extra nudge after the “behind” offset (map pixels). Positive x = right, y = down.
 * When the pet is horizontally flipped, `MAP_PET_OFFSET_X` is negated so the nudge stays visually consistent.
 */
export const MAP_PET_OFFSET_X = 25;
export const MAP_PET_OFFSET_Y = 10;

/**
 * Which horizontal walk reuses the opposite row and `scaleX(-1)`.
 * - `"A"`: the side row faces right (mirror for left / walk A).
 * - `"D"`: the side row faces left (mirror for right / walk D).
 */
export const MAP_PET_HORIZ_FLIP: "A" | "D" = "D";
