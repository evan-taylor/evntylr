import { EMAIL_ADDRESS, experienceItems, footerContent, heroContent, linkItems, nowContent } from "../content";
import { CopyEmailButton } from "./copy-email-button";
import { UiMotion } from "./ui-motion";

export function HomePage() {
  return (
    <div className="site-shell">
      <UiMotion />
      <div className="scroll-progress" aria-hidden="true" />
      <div className="preview" aria-hidden="true">
        <img alt="" width={300} height={188} draggable={false} />
      </div>
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

          <section className="block section">
            <h2 className="section-title">Experience</h2>
            <ul className="experience-list" aria-label="Experience">
              {experienceItems.map((item) => (
                <li
                  key={item.organization}
                  className="experience-item hover-row"
                  data-preview={item.preview}
                >
                  <p className="experience-period">{item.period}</p>
                  <div className="experience-main">
                    <p className="experience-role">{item.role}</p>
                    <p className="experience-organization">{item.organization}</p>
                    <p className="experience-details">{item.details}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="block section">
            <h2 className="section-title">Selected Links</h2>
            <ul className="links-list" aria-label="Selected links">
              {linkItems.map((item) => (
                <li key={item.label} className="hover-row">
                  {item.kind === "copy" ? (
                    <CopyEmailButton
                      variant="row"
                      email={item.email}
                      label={item.label}
                      details={item.details}
                    />
                  ) : (
                    <a
                      className="item-link"
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        item.href.startsWith("http")
                          ? "noreferrer noopener"
                          : undefined
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

          <section className="block section">
            <h2 className="section-title">Now</h2>
            <p className="copy">{nowContent}</p>
          </section>

          <section className="block section">
            <h2 className="section-title">Connect</h2>
            <p className="copy">
              Reach me at{" "}
              <CopyEmailButton
                variant="inline"
                email={EMAIL_ADDRESS}
                label={EMAIL_ADDRESS}
              />{" "}
              or on{" "}
              <a
                className="soft-link"
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
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
