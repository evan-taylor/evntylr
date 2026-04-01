import { siteConfig } from "@/lib/site";
import {
  EMAIL_ADDRESS,
  experienceItems,
  footerContent,
  heroContent,
  linkItems,
  nowContent,
} from "../content";
import { CopyEmailButton } from "./copy-email-button";
import { UiMotion } from "./ui-motion";

export function HomePage() {
  const personStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    email: EMAIL_ADDRESS,
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
    knowsAbout: [
      "React",
      "Python",
      "Java",
      "Algorithms",
      "Software Development",
    ],
  };

  return (
    <div className="site-shell">
      <script type="application/ld+json">
        {JSON.stringify(personStructuredData)}
      </script>
      <UiMotion />
      <div aria-hidden="true" className="scroll-progress" />
      <div aria-hidden="true" className="preview" />
      <div className="site-frame">
        <main className="content">
          <section className="block">
            <p className="name">{heroContent.name}</p>
            <p className="lead">
              <span className="serif">{heroContent.accent}</span>{" "}
              {heroContent.lead}
            </p>
            <p className="copy">{heroContent.location}</p>
          </section>

          <section className="section block">
            <h2 className="section-title">Experience</h2>
            <ul aria-label="Experience" className="experience-list">
              {experienceItems.map((item) => (
                <li
                  className="experience-item hover-row"
                  data-preview={item.preview}
                  key={item.organization}
                >
                  <p className="experience-period">{item.period}</p>
                  <div className="experience-main">
                    <p className="experience-role">{item.role}</p>
                    <p className="experience-organization">
                      {item.organization}
                    </p>
                    <p className="experience-details">{item.details}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="section block">
            <h2 className="section-title">Selected Links</h2>
            <ul aria-label="Selected links" className="links-list">
              {linkItems.map((item) => (
                <li className="hover-row" key={item.label}>
                  {item.kind === "copy" ? (
                    <CopyEmailButton
                      details={item.details}
                      email={item.email}
                      label={item.label}
                      variant="row"
                    />
                  ) : (
                    <a
                      className="item-link"
                      href={item.href}
                      rel={
                        item.href.startsWith("http")
                          ? "noreferrer noopener"
                          : undefined
                      }
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                    >
                      <span className="item-label">
                        {item.label}
                        <span aria-hidden="true" className="item-arrow">
                          ↗
                        </span>
                      </span>
                      <span className="item-description">{item.details}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="section block">
            <h2 className="section-title">Now</h2>
            <p className="copy">{nowContent}</p>
          </section>

          <section className="section block">
            <h2 className="section-title">Connect</h2>
            <p className="copy">
              Reach me at{" "}
              <CopyEmailButton
                email={EMAIL_ADDRESS}
                label={EMAIL_ADDRESS}
                variant="inline"
              />{" "}
              or on{" "}
              <a
                className="soft-link"
                href="https://www.linkedin.com"
                rel="noreferrer noopener"
                target="_blank"
              >
                LinkedIn
              </a>
              .
            </p>
          </section>
        </main>

        <footer className="footer block">
          <span>{footerContent.credit}</span>
          <span className="year">{footerContent.year}</span>
        </footer>
      </div>
    </div>
  );
}
