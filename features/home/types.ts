export type ExperienceItem = {
  organization: string;
  role: string;
  period: string;
  details: string;
  preview: string;
};

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
