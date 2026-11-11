// Contact details used across the site.
export const EMAIL = "brainilioir@gmail.com";
// Paste the scheduling link here (e.g. a Calendly URL). Until then "Book a call" opens an email asking for a time.
export const SCHEDULE_URL = "";
export const scheduleHref = SCHEDULE_URL || `mailto:${EMAIL}?subject=${encodeURIComponent("Let's set up a call")}`;
export const RESUME_URL = "https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing";
export const LINKS = [["LinkedIn", "https://linkedin.com/in/brainilio", "tabler--brand-linkedin"], ["GitHub", "https://github.com/Brainilio", "tabler--brand-github"]];
// What I take on as a freelancer.
// [text, icon] pairs.
export const OFFER = [
  ["React Native & Expo apps", "tabler--device-mobile"],
  ["Websites & web apps", "tabler--browser"],
  ["Back-end & AWS", "tabler--cloud"],
  ["Sign-in & payments", "tabler--lock"],
  ["Features & performance", "tabler--gauge"],
  ["Design & design systems", "tabler--palette"],
];
