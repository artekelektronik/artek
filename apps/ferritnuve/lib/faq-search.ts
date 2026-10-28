// Client-safe FAQ helpers: the FAQ page's search box runs these in the browser.
export type FaqItem = {
  id: string;
  group: "technical" | "company" | "guides";
  question: string;
  answer: string;
  link?: {href: string; label: string};
  source?: {href: string; label: string};
};

const normalize = (text: string) => text.toLocaleLowerCase("tr").replace(/[ğüşıöçâî]/g, c => ({ğ: "g", ü: "u", ş: "s", ı: "i", ö: "o", ç: "c", â: "a", î: "i"})[c] ?? c);

// Every typed word must appear in the question or answer; Turkish letters match their plain forms.
export function matchFaq(items: FaqItem[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const text = normalize(`${item.question} ${item.answer}`);
    return words.every(word => text.includes(word));
  });
}

// Visitors sometimes type contact details into a search box; keep them out of analytics.
export function scrubSearch(text: string) {
  return text
    .replace(/\S+@\S+\.\S+/g, "[e-posta]")
    .replace(/\+?\d[\d\s()-]{6,}\d/g, "[tel]")
    .replace(/\s+/g, " ")
    .trim();
}
