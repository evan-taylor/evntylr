export interface ExperienceItem {
  details: string;
  organization: string;
  period: string;
  preview: string;
  role: string;
}

export type LinkItem =
  | {
      kind: "link";
      label: string;
      href: string;
      details: string;
    }
  | {
      kind: "copy";
      label: string;
      email: string;
      details: string;
    };
