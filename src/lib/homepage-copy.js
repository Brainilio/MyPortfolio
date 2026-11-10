import { asText } from "@prismicio/client";

// CMS fields are plain copy only; the existing layout and motion own their presentation.
export function copyText(value, fallback) {
  const text = typeof value === "string" ? value : Array.isArray(value) ? asText(value) : "";
  return text.trim() ? text : fallback;
}
