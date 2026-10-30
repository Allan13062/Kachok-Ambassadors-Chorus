# Kachamba Chorus

<p align="center">
  <strong>Adventist Youth Ministry (AYM) · A cappella music · Faith · Fellowship · Service</strong>
</p>

<p align="center">
  <a href="https://kachambachorus.online">Official Website</a>
</p>

Kachamba Chorus, also known as **Kachok Ambassadors Chorus**, is an Adventist youth ministry. This repository contains the website project for the chorus and its public-facing digital presence.

The website is the central place to introduce the ministry, share its music and story, publish approved news and event information, and help audiences, members, churches, partners, and supporters connect with the chorus.

> **Repository maintainer note:** The public website identifies the project as “Kachamba Chorus | Adventist Youth Ministry (AYM).” The exact source-code stack, repository URL, package manager, environment variables, hosting provider, and deployment workflow have not been independently verified. This README intentionally does not guess those implementation details. Complete the marked technical sections from the actual repository before using the commands in production.

---

## Contents

- [About the chorus](#about-the-chorus)
- [Purpose and values](#purpose-and-values)
- [Music and recordings](#music-and-recordings)
- [Community engagement](#community-engagement)
- [About this website](#about-this-website)
- [Website content guidelines](#website-content-guidelines)
- [Technology stack](#technology-stack)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Development workflow](#development-workflow)
- [Accessibility, performance, and SEO](#accessibility-performance-and-seo)
- [Privacy, safeguarding, and media rights](#privacy-safeguarding-and-media-rights)
- [Deployment and maintenance](#deployment-and-maintenance)
- [Contributing](#contributing)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About the chorus

Kachamba Chorus is publicly associated with the name **Kachok Ambassadors Chorus** and describes itself as an Adventist Youth Ministry (AYM) a cappella group. Its public identity brings together choral music, Christian faith, youth fellowship, and service.

The chorus's music is available through digital music platforms. Public artist listings include releases such as **Be Yesu Ling'** and **NEEMA**, as well as the live album **Shangwe na Vigelegele (LIVE)**. These listings help document the group's musical work; always link to the official artist pages and verify release information before publishing updates.

## Purpose and values

The website should reflect the ministry's identity and communicate its work in a welcoming, accurate, and consistent way.

The following values provide a practical editorial and design foundation:

- **Faith:** Keep the ministry's Christian purpose central.
- **Worship:** Use music to encourage worship and spiritual reflection.
- **Excellence:** Present the chorus and its work with care, preparation, and musical discipline.
- **Fellowship:** Celebrate unity, teamwork, and a supportive community.
- **Service:** Highlight approved outreach and community-support activities.
- **Integrity:** Publish accurate information and handle donations, personal information, and partnerships transparently.
- **Stewardship:** Respect the time, resources, creative work, and privacy of members and supporters.

## Music and recordings

Music is a core part of the chorus's public identity. The website may feature:

- Official music releases and streaming links.
- Approved live performance recordings.
- Event and concert highlights.
- Artist and album information.
- Performance announcements and booking enquiries, if authorised.

Publicly listed releases associated with Kachok Ambassadors Chorus include:

| Release | Public listing |
|---|---|
| *Be Yesu Ling'* | Amazon Music |
| *NEEMA* | Apple Music |
| *Shangwe na Vigelegele (LIVE)* | Amazon Music |

When adding a release, confirm its title, artwork, release date, track listing, credits, and destination links with the authorised music or ministry representative. Do not upload copyrighted recordings or lyrics unless the chorus has the necessary rights and permissions.

## Community engagement

The chorus has also been publicly documented participating in community-support work. One reported example is the **Triple L Initiative (Let Lydia Lean)** fundraiser, held on 8 December 2024 at Kisumu South SDA Church to support Lydia Achieng's medical treatment. Adventists News Kenya reported that the fundraiser collected KES 202,600 toward a KES 450,000 target.

This is a historical example, not a statement that the fundraiser is still active. Any future fundraising page must be approved and must clearly state the beneficiary, purpose, dates, authorised payment channels, financial accountability arrangements, and contact for verification.

## About this website

**Live website:** [https://kachambachorus.online](https://kachambachorus.online)

The website should serve the needs of several audiences:

- **Visitors and audiences** who want to learn about the chorus and discover its music.
- **Members and families** who need approved announcements and programme information.
- **Churches and event organisers** who want to understand the ministry and make enquiries.
- **Partners and supporters** who want to learn about approved initiatives and ways to support the work.
- **Developers and maintainers** who need clear instructions for updating and operating the website.

### Suggested website sections

The exact pages should follow the current website structure. A useful content model includes:

1. **Home** — a concise introduction, identity, featured content, and current announcements.
2. **About** — the chorus story, mission, values, and leadership-approved profile.
3. **Music** — releases, recordings, streaming links, and music news.
4. **Events** — confirmed upcoming programmes, concerts, and event recaps.
5. **Gallery** — approved photographs and video highlights.
6. **Outreach** — completed and current community initiatives, with clear status and accountability.
7. **Contact** — verified official communication channels and enquiry information.

Do not create pages or imply programmes exist unless the chorus has confirmed them.

## Website content guidelines

All public content should be:

- Approved by the appropriate chorus or ministry representative.
- Accurate, current, and written in clear language.
- Respectful of the chorus's Christian identity and community.
- Consistent in spelling of names, event titles, dates, and locations.
- Supported by permission for photographs, recordings, logos, and third-party material.
- Updated when events end, details change, or information becomes outdated.

For events, verify the date, time, venue, organiser, registration instructions, and contact person before publication. For completed events, label recaps as historical.

## Technology stack

Fill in this section from the actual repository. Do not assume that the site uses a particular framework.

| Area | Project implementation |
|---|---|
| Frontend framework | To be confirmed from source files |
| Language | To be confirmed |
| Styling system | To be confirmed |
| Package manager | To be confirmed from lockfile |
| Build tool | To be confirmed |
| Hosting / deployment | To be confirmed |
| Domain | `kachambachorus.online` |
| Content management | To be confirmed |

Useful files to inspect:

- `package.json` — scripts and JavaScript dependencies.
- `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` — package manager and dependency lock.
- `vite.config.*`, `next.config.*`, `astro.config.*`, or equivalent — framework/build configuration.
- `README`, `.github/workflows/`, `Dockerfile`, and hosting configuration — development and release workflows.
- `.env.example` — documented environment variable names, if the project uses them.

## Getting started

### Requirements

Install the runtime and package manager required by the actual project. For a JavaScript/TypeScript application, this is commonly Node.js plus npm, pnpm, or Yarn; use the version and package manager specified by the repository.

### Clone the repository

Replace the placeholders with the real repository URL and directory:

```bash
git clone <REPOSITORY_URL>
cd <REPOSITORY_DIRECTORY>
```

### Install dependencies

Use the package manager that matches the committed lockfile. Examples:

```bash
# npm
npm ci

# pnpm
pnpm install --frozen-lockfile

# Yarn
yarn install --immutable
```

Run only the command appropriate to this repository.

### Run locally

Inspect the scripts in `package.json` or the equivalent project configuration. Common examples are:

```bash
npm run dev
npm run build
npm run preview
```

These are examples only. Use the actual scripts defined by the project. If the application uses a different stack, replace this section with its official setup instructions.

## Environment configuration

Document every environment variable the application actually reads. Never commit production credentials, passwords, private tokens, API keys, or signing secrets.

If environment variables are required, maintain a safe `.env.example` containing variable names and placeholder values only.

| Variable | Description | Required |
|---|---|---|
| `PUBLIC_SITE_URL` | Canonical public URL, if read by the application | Verify in source |
| Other variables | Add only variables used by the application | Verify in source |

If no environment variables are needed, state that explicitly and remove the example variable above.

## Development workflow

A recommended workflow for website changes:

1. Confirm the requested change and obtain content approval where needed.
2. Create a branch for the task.
3. Install dependencies using the repository's documented procedure.
4. Make a focused change that follows the existing architecture and style.
5. Run the configured formatter, linter, tests, and production build.
6. Check the result on mobile, tablet, and desktop layouts.
7. Review links, forms, images, metadata, and browser console errors.
8. Submit a pull request with a clear explanation and screenshots for visual changes.
9. Obtain maintainer approval before merging and publishing.

Suggested branch names:

```text
feature/music-section
feature/event-announcements
fix/mobile-navigation
docs/update-readme
```

## Accessibility, performance, and SEO

The website should be inclusive, fast, and easy to discover.

### Accessibility

- Use semantic HTML and a logical heading structure.
- Ensure keyboard navigation and visible focus states.
- Provide descriptive alternative text for meaningful images.
- Use captions or transcripts for relevant video and audio content.
- Maintain readable contrast and responsive text sizing.
- Give forms clear labels and useful error messages.

### Performance

- Optimise images and serve appropriately sized formats.
- Avoid unnecessarily large media files and scripts.
- Lazy-load below-the-fold imagery where appropriate.
- Minimise layout shifts and keep pages responsive.
- Test real mobile performance, not only desktop performance.

### Search visibility

- Give every page a meaningful title and meta description.
- Use descriptive URLs and headings.
- Set the canonical domain consistently.
- Add social sharing metadata and a suitable preview image.
- Maintain a sitemap and robots directives where appropriate.
- Use structured data only when it accurately describes the page.

## Privacy, safeguarding, and media rights

The chorus website may contain photographs, videos, music, testimonials, event details, and information submitted by visitors. Treat this material responsibly.

- Obtain permission before publishing identifiable photographs, recordings, testimonials, or personal details.
- Apply appropriate safeguarding practices when content includes children or young people.
- Collect only the personal information needed for a clearly stated purpose.
- Explain how enquiry forms or mailing lists use submitted information.
- Restrict access to private member, donor, and administrative information.
- Do not publish confidential membership lists, private correspondence, financial records, or internal documents.
- Obtain the required rights or licences for music, lyrics, arrangements, artwork, and third-party assets.
- Credit creators and contributors where required.
- Provide a suitable channel for privacy, correction, or content-removal requests.

If the website accepts donations or fundraising contributions, publish only authorised payment details and explain who is responsible for the initiative and its financial reporting.

## Deployment and maintenance

**Production website:** [https://kachambachorus.online](https://kachambachorus.online)

The hosting provider, deployment branch, build command, DNS configuration, and release process have not been verified. The maintainer should document them here after checking the hosting account and repository configuration.

Before each production release:

- [ ] Confirm the change is approved.
- [ ] Run the project's tests, linting, and production build where configured.
- [ ] Check the site on common screen sizes.
- [ ] Verify navigation, forms, downloads, and external links.
- [ ] Review public names, dates, venues, and contact details.
- [ ] Check image permissions and remove accidental private information.
- [ ] Confirm no secrets are included in the build or repository.
- [ ] Deploy through the authorised hosting workflow.
- [ ] Verify the live site and important pages after deployment.

Keep dependencies updated, remove obsolete announcements, renew domain and hosting services on time, and maintain secure backups of site content and configuration.

## Contributing

Contributions from authorised developers, content editors, and ministry collaborators are welcome.

1. Discuss substantial changes with the project maintainer before starting.
2. Keep changes focused and consistent with the existing codebase.
3. Follow the project's established formatting and testing conventions.
4. Do not add unlicensed images, music, fonts, or other third-party assets.
5. Include screenshots for visual changes where practical.
6. Submit changes for review before merging or publishing.

Only authorised representatives should approve official statements, fundraising appeals, event announcements, leadership information, and ministry-wide communications.

## Contact

- **Website:** [https://kachambachorus.online](https://kachambachorus.online)
- **Official email:** Add after verification.
- **Official phone / WhatsApp:** Add after verification.
- **Official social accounts:** Link only accounts confirmed by the chorus.

For technical issues, use the repository's issue tracker or contact its authorised maintainer.

## Acknowledgements

With appreciation to the chorus members, ministry leaders, families, churches, music collaborators, event organisers, volunteers, audiences, partners, and supporters whose service and encouragement sustain the work.

The website exists to help Kachamba Chorus share its music, communicate its ministry, strengthen fellowship, and make it easier for people to connect with its work.

---

## References

The following public sources informed the ministry and music background in this README. Confirm details with the chorus before treating third-party listings as the final authority.

- [Kachamba Chorus — official website](https://kachambachorus.online/)
- [Adventists News Kenya — Triple L Initiative fundraiser (18 December 2024)](https://adventistnews.co.ke/triple-l-initiative-fundraiser-raises-kes-202600-for-lydia-achiengs-medical-treatment/)
- [Kachok Ambassadors Chorus — Amazon Music artist listing](https://music.amazon.in/artists/B0D4R3HWKC/kachok-ambassadors-chorus)
- [Kachok Ambassadors Chorus — Apple Music, NEEMA](https://music.apple.com/us/album/neema/1793865101)

---

*Maintained for the Kachamba Chorus website. Update this document whenever the source-code setup, official ministry information, contact channels, or deployment process changes.*
