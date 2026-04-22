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
