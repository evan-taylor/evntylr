export interface ExperienceItem {
  details: string;
  id: string;
  /** Short name for the wheel when it differs from the organization. */
  label?: string;
  organization: string;
  period: string;
  preview?: string;
  role: string;
  url?: string;
  urlLabel?: string;
}

export interface ContactLink {
  hint: string;
  href: string;
  label: string;
}
