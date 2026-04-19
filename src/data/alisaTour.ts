/**
 * Alisa the in-game tour guide.
 *
 * Each waypoint is a building Alisa walks to, a direction she faces
 * when she gets there (matches the sprite sheet rows S/A/D/W), and a
 * short dialogue line she delivers. Coordinates use the same 0-100 %
 * space as the map's building zones.
 */

export type AlisaDirection = "S" | "A" | "D" | "W";

export type AlisaWaypoint = {
  id: string;
  label: string;
  href: string;
  x: number; // center X of the building in % (0-100)
  y: number; // center Y of the building in % (0-100)
  // Offset from the building centre to stand next to it, not on top.
  standOffsetX?: number;
  standOffsetY?: number;
  facing: AlisaDirection;
  lines: string[];
};

// Building centres taken from app/map/page.tsx:buildingZones.
// Order intentionally narrative: quick wins → stakes → mastery.
export const ALISA_TOUR: AlisaWaypoint[] = [
  {
    id: "intro",
    label: "Intro",
    href: "/map",
    x: 50,
    y: 60, // default player spawn point
    facing: "S",
    lines: [
      "Hey pilot, I'm Alisa. I'll give you the quick tour before you loose on the map.",
      "We'll hit every building in about two minutes. Hit Next to keep moving, or Skip Tour if you'd rather explore solo.",
    ],
  },
  {
    id: "stats-2",
    label: "Your Stats",
    href: "/stats",
    x: 57, // centre of { x: 50, y: 40, w: 14, h: 18 }
    y: 49,
    standOffsetY: 6,
    facing: "W",
    lines: [
      "This is Stats. Your level, XP, daily streak, and global rank live here.",
      "Anything you do across the academy lands on this dashboard \u2014 it's your scoreboard.",
    ],
  },
  {
    id: "investment-news",
    label: "Investment & AI News",
    href: "/investment",
    x: 37, // centre of { x: 30, y: 36, w: 14, h: 18 }
    y: 45,
    standOffsetY: 6,
    facing: "W",
    lines: [
      "Investment & News: daily AI moves, funding, and signal you can't afford to miss.",
      "Good pilots read the news. Great pilots know which trades it changes.",
    ],
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    href: "/tools",
    x: 21, // centre of { x: 12, y: 66, w: 18, h: 20 }
    y: 76,
    standOffsetY: -6, // stand above it
    facing: "W", // face up toward the building
    lines: [
      "Tools Workshop. Six hands-on modules on prompts, chains, safety, evals, deploys, teamwork.",
      "Check steps off as you finish. These are the fundamentals that separate demo agents from real ones.",
    ],
  },
  {
    id: "field",
    label: "Your Field",
    href: "/field",
    x: 16, // centre of { x: 4, y: 4, w: 24, h: 34 }
    y: 21,
    standOffsetX: 4,
    facing: "D",
    lines: [
      "Your Field. Based on the interests you picked, you'll get custom missions here.",
      "This is where \u2018AI for healthcare\u2019 stops being a buzzword and becomes your shipping queue.",
    ],
  },
  {
    id: "ethics-center",
    label: "AI Ethics Center",
    href: "/ethics",
    x: 53, // centre of { x: 45, y: 4, w: 16, h: 20 }
    y: 14,
    standOffsetY: 6,
    facing: "W",
    lines: [
      "AI Ethics Center. Scenario-based challenges on bias, privacy, refusal design.",
      "You'll get XP for good calls. You'll also see the cost of bad ones \u2014 use that.",
    ],
  },
  {
    id: "learn-code",
    label: "Coding Arena",
    href: "/arena",
    x: 75, // centre of { x: 70, y: 35, w: 10, h: 10 }
    y: 40,
    standOffsetY: 6,
    facing: "W",
    lines: [
      "The Arena. LeetCode for prompt engineering \u2014 real test cases, real LLM grading.",
      "Solve clean to level up. Try the beginner track if it's your first session.",
    ],
  },
  {
    id: "side-quests",
    label: "Side Quests",
    href: "/side-quests",
    x: 77, // centre of { x: 71, y: 63, w: 13, h: 24 }
    y: 75,
    standOffsetX: -4,
    facing: "D",
    lines: [
      "Side Quests. Live video rooms to co-build agents with other pilots.",
      "There's a terminal in there too \u2014 type `opencode` in-room and I'll chime in with advice.",
    ],
  },
  {
    id: "outro",
    label: "Wrap",
    href: "/map",
    x: 50,
    y: 60,
    facing: "S",
    lines: [
      "That's the loop. Start anywhere, finish everything \u2014 Side Quests pair great with the Arena.",
      "Press E near any building to enter. Escape anywhere sends you back here. Good luck, pilot.",
    ],
  },
];

export type AlisaTourStep = (typeof ALISA_TOUR)[number];
