import Image from "next/image";
import { siteConfig } from "@/lib/site";
import {
  aboutFacts,
  contactLinks,
  EMAIL_ADDRESS,
  experienceItems,
  GITHUB_HREF,
  heroContent,
  LINKEDIN_HREF,
} from "../content";
import type { ExperienceItem } from "../types";
import { CopyEmailButton } from "./copy-email-button";
import { LocalTime } from "./local-time";
import { Wheel, type WheelSection } from "./wheel";

const isExternalLink = (href: string) => href.startsWith("http");

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

function AboutPanel() {
  return (
    <>
      <p className="panel-lead">{heroContent.lead}</p>
      <dl className="facts">
        {aboutFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function ExperiencePanel({
  item,
  priority,
}: {
  item: ExperienceItem;
  priority: boolean;
}) {
  return (
    <>
      {item.preview ? (
        <div className="panel-shot">
          <Image
            alt={`The ${item.organization} website`}
            fill
            loading={priority ? undefined : "eager"}
            priority={priority}
            sizes="(max-width: 760px) 100vw, 384px"
            src={item.preview}
          />
        </div>
      ) : null}
      <h2 className="panel-title">{item.organization}</h2>
      <p className="panel-meta">
        {item.role}, {item.period}
      </p>
      <p className="panel-body">{item.details}</p>
      {item.url ? (
        <a
          className="panel-link"
          href={item.url}
          rel="noreferrer noopener"
          target="_blank"
        >
          {item.urlLabel}
          <ExternalArrow />
        </a>
      ) : null}
    </>
  );
}

function ContactPanel() {
  return (
    <>
      <h2 className="panel-title">Say hello</h2>
      <div className="contact-rows">
        <CopyEmailButton email={EMAIL_ADDRESS} />
        {contactLinks.map((link) => (
          <a
            className="contact-row"
            href={link.href}
            key={link.label}
            rel={isExternalLink(link.href) ? "noreferrer noopener" : undefined}
            target={isExternalLink(link.href) ? "_blank" : undefined}
          >
            <span>{link.label}</span>
            <span>
              {link.hint} <ExternalArrow />
            </span>
          </a>
        ))}
      </div>
    </>
  );
}

export function HomePage() {
  const personStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: EMAIL_ADDRESS,
    sameAs: [GITHUB_HREF, LINKEDIN_HREF],
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Luis Obispo",
      addressRegion: "CA",
      addressCountry: "US",
    },
    affiliation: {
      "@type": "CollegeOrUniversity",
      name: "California Polytechnic State University",
    },
    knowsAbout: ["TypeScript", "React", "Next.js", "Python", "PostgreSQL"],
  };

  const sections: WheelSection[] = [
    { id: "about", label: "About", name: "About", panel: <AboutPanel /> },
    ...experienceItems.map((item, index) => ({
      id: item.id,
      label: item.label ?? item.organization,
      name: item.organization,
      panel: <ExperiencePanel item={item} priority={index === 0} />,
    })),
    {
      id: "contact",
      label: "Contact",
      name: "Contact",
      panel: <ContactPanel />,
    },
  ];

  return (
    <div className="site">
      <script type="application/ld+json">
        {JSON.stringify(personStructuredData)}
      </script>
      <header className="site-header">
        <h1 className="site-name">{heroContent.name}</h1>
        <p className="site-place">
          {heroContent.city}, <LocalTime timeZone={heroContent.timeZone} />
        </p>
      </header>
      <main className="site-main">
        <Wheel sections={sections} />
      </main>
    </div>
  );
}
