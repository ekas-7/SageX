/**
 * Interest tags for onboarding (stored as `id` on the player; labels are display-only).
 */
export const ONBOARDING_INTERESTS = [
  { id: "product", label: "Product & UX" },
  { id: "design", label: "Design & Creative" },
  { id: "engineering", label: "Software & Systems" },
  { id: "data_science", label: "Data & Analytics" },
  { id: "ml", label: "Machine Learning" },
  { id: "nlp", label: "NLP & Language AI" },
  { id: "cv", label: "Computer Vision" },
  { id: "robotics", label: "Robotics & Embodied AI" },
  { id: "healthcare", label: "Healthcare & Bio" },
  { id: "finance", label: "Finance & Trading" },
  { id: "climate", label: "Climate & Energy" },
  { id: "education", label: "Education & Research" },
  { id: "policy", label: "Policy & Ethics" },
  { id: "open_source", label: "Open Source" },
  { id: "dev_tools", label: "MLOps & DevTools" },
  { id: "startups", label: "Startups & GTM" },
  { id: "games", label: "Games & Interactive" },
  { id: "arts", label: "Arts & Media" },
  { id: "space", label: "Space & Science" },
  { id: "legal", label: "Legal & Compliance" },
  { id: "career", label: "Career & Hiring" },
  { id: "hobbyist", label: "Hobby & Exploration" },
  { id: "student", label: "Student" },
] as const;

export type OnboardingInterestId = (typeof ONBOARDING_INTERESTS)[number]["id"];
