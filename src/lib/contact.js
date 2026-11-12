// Contact details used across the site.
export const EMAIL = "brainilioir@gmail.com";
// Paste the scheduling link here (e.g. a Calendly URL). Until then "Book a call" opens an email asking for a time.
export const SCHEDULE_URL = "";
export const scheduleHref = SCHEDULE_URL || `mailto:${EMAIL}?subject=${encodeURIComponent("Let's set up a call")}`;
export const RESUME_URL = "https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing";
export const LINKS = [["LinkedIn", "https://linkedin.com/in/brainilio", "tabler--brand-linkedin"], ["GitHub", "https://github.com/Brainilio", "tabler--brand-github"]];
export const AVAILABILITY = "Open to meaningful opportunities";

export const OFFER = [
  ["Web & mobile applications", "tabler--device-mobile"],
  ["Interfaces & design systems", "tabler--palette"],
  ["APIs & architecture", "tabler--cloud"],
  ["Product discovery & MVPs", "tabler--briefcase"],
];
