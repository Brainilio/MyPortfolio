// Contact details used across the site.
export const EMAIL = "brainilioir@gmail.com";
// Paste the scheduling link here (e.g. a Calendly URL). Until then "Book a call" opens an email asking for a time.
export const SCHEDULE_URL = "";
export const scheduleHref = SCHEDULE_URL || `mailto:${EMAIL}?subject=${encodeURIComponent("Let's set up a call")}`;
export const RESUME_URL = "https://drive.google.com/file/d/1TgOjKdYPxZr7SmBChUm1osO84EPkXSA8/view?usp=sharing";
export const LINKS = [["LinkedIn", "https://linkedin.com/in/brainilio"], ["GitHub", "https://github.com/Brainilio"]];
// What I take on as a freelancer.
export const OFFER = ["Mobile apps with React Native and Expo", "Web apps and sites with Next.js", "Back ends and cloud on AWS", "Design systems and component libraries"];
