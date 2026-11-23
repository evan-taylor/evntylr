import type { ContactLink, ExperienceItem } from "./types";

export const EMAIL_ADDRESS = "evan@evntylr.com";
export const RESUME_HREF = "/Evan-Taylor.pdf";
export const GITHUB_HREF = "https://github.com/evan-taylor";
export const LINKEDIN_HREF = "https://www.linkedin.com/in/evan-l-taylor/";

export const heroContent = {
  name: "Evan Taylor",
  accent: "Computer Science student at Cal Poly.",
  lead: "I build software and care a lot about how it feels to use. I’m studying computer science at Cal Poly, building Soljio, and working on product at Hovn.",
  location: "San Luis Obispo, CA / Vancouver, WA",
  role: "Software developer",
  city: "San Luis Obispo",
  timeZone: "America/Los_Angeles",
};

export const aboutFacts = [
  {
    label: "Studying",
    value: "B.S. Computer Science at Cal Poly, graduating May 2027",
  },
  {
    label: "Working in",
    value: "TypeScript, React, Next.js, React Native, Python, PostgreSQL",
  },
];

export const experienceItems: ExperienceItem[] = [
  {
    id: "soljio",
    organization: "Soljio",
    role: "Founder",
    period: "Jan 2026 – present",
    details:
      "One platform for swim schools to handle scheduling, enrollment, billing and communications. I designed and built it as the only engineer, and I lead product and sales.",
    url: "https://soljio.com",
    urlLabel: "soljio.com",
    preview: "/previews/soljio.png",
  },
  {
    id: "hovn",
    organization: "Hovn",
    role: "Software Development Intern",
    period: "Jun 2025 – present",
    details:
      "Full-stack features across a platform for training providers, from class scheduling and payments to rosters and course materials. I work with customers directly and plan the roadmap with the co-founders.",
    url: "https://www.hovn.app",
    urlLabel: "hovn.app",
    preview: "/previews/hovn.png",
  },
  {
    id: "codebox",
    organization: "Codebox at Cal Poly",
    label: "Codebox",
    role: "Director of Engineering",
    period: "May 2026 – present",
    details:
      "I lead internal tool development and help student project teams make architecture and technology decisions.",
    url: "https://www.codebox.so/",
    urlLabel: "codebox.so",
    preview: "/previews/codebox.png",
  },
  {
    id: "taylored",
    organization: "Taylored Instruction",
    role: "Founder",
    period: "2023 – present",
    details:
      "A health and safety training business. I run it, and I built the scheduling, payment and reminder systems behind it.",
    url: "https://tayloredinstruction.com",
    urlLabel: "tayloredinstruction.com",
    preview: "/previews/taylored.png",
  },
  {
    id: "manage",
    organization: "Manage Inc.",
    label: "Manage",
    role: "Intern",
    period: "Jun – Sep 2025",
    details:
      "Built Flask endpoints that query IBM Db2 on IBM i, and an internal tool that improves intrusion detection alerts.",
    url: "https://www.manageinc.com",
    urlLabel: "manageinc.com",
    preview: "/previews/manage.png",
  },
];

export const contactLinks: ContactLink[] = [
  { label: "GitHub", href: GITHUB_HREF, hint: "evan-taylor" },
  { label: "LinkedIn", href: LINKEDIN_HREF, hint: "evan-l-taylor" },
  { label: "Résumé", href: RESUME_HREF, hint: "PDF" },
];
