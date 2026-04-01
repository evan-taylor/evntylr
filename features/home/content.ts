import type { ExperienceItem, LinkItem } from "./types";

export const EMAIL_ADDRESS = "hello@evntylr.com";

export const heroContent = {
  name: "Evan Taylor",
  accent: "Computer Science student at Cal Poly.",
  lead: "Building software with a focus on UX quality and efficient interfaces.",
  location: "San Luis Obispo, CA / Vancouver, WA",
};

export const experienceItems: ExperienceItem[] = [
  {
    organization: "Hovn",
    role: "Software Development Intern",
    period: "2025 - Present",
    details: "Shipping full-stack features, bug fixes, and UX improvements.",
    preview: "/previews/hovn.png",
  },
  {
    organization: "Manage Incorporated",
    role: "Engineering Intern",
    period: "2025 - Present",
    details: "Connecting Apache web interfaces with IBM i backend systems.",
    preview: "/previews/manage.png",
  },
  {
    organization: "Taylored Instruction LLC",
    role: "Founder",
    period: "2023 - Present",
    details: "Running operations for a health and safety training business.",
    preview: "/previews/taylored.png",
  },
];

export const linkItems: LinkItem[] = [
  {
    kind: "link",
    label: "Resume PDF",
    href: "/Evan-Taylor.pdf",
    details: "Current student + internship experience.",
  },
  {
    kind: "link",
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    details: "Education, projects, and work history.",
  },
  {
    kind: "copy",
    label: "Email",
    email: EMAIL_ADDRESS,
    details: "Copy address to reach me directly.",
  },
];

export const nowContent =
  "Studying software development, algorithms, and database systems and applying that work directly in React, Python, and Java projects.";

export const footerContent = {
  credit: "Built with care.",
  year: "2026",
};
