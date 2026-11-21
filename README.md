# EliusWiki

A personal encyclopedia for Elius — built as a fast, static wiki with plain HTML, CSS, and JavaScript.

- **Canonical domain:** `elius.wiki`
- **Instagram:** [@ielius_](https://www.instagram.com/ielius_/)
- **Email:** [ahmedelius34@gmail.com](mailto:ahmedelius34@gmail.com)

## Preview locally

```bash
cd ~/eliuswiki
python3 -m http.server 8080
```

Open <http://localhost:8080>.

No build step, no dependencies, no database.

## Pages

| Page | File |
| --- | --- |
| Main page | `index.html` |
| Elius | `wiki/elius.html` |
| EliusWiki | `wiki/eliuswiki.html` |
| Projects | `wiki/projects.html` |
| Contact | `wiki/contact.html` |
| All articles | `wiki/all.html` |
| 404 | `404.html` |

## Make it yours

1. **Add real biography details** in `wiki/elius.html`. The work and interests sections are intentionally marked as open until there is something to publish.
2. **Add projects** in `wiki/projects.html` by replacing the empty state with a table or cards.
3. **Update search** in `assets/js/search-index.js` whenever you add a page.
4. **Update the date** in the article meta and sitemap when you edit a page.
5. **Change contact details** everywhere with:

   ```bash
   grep -R "ahmedelius34@gmail.com" .
   grep -R "ielius_" .
   ```

6. **Change the domain** everywhere with:

   ```bash
   grep -R "elius.wiki" .
   ```

## Domain

`elius.wiki` is used as the canonical domain throughout the metadata, sitemap, and `CNAME` file.

A public RDAP lookup on 21 November 2026 returned no registration record for `elius.wiki`, which suggests it may be available. This is not a guarantee — confirm availability and pricing at a registrar before buying. Good registrars for a `.wiki` domain include Cloudflare Registrar, Porkbun, and Namecheap.

Other names that returned no registration record in the same check: `eliuswiki.com`, `eliuswiki.wiki`, `elius.page`, `elius.info`, `elius.site`. (`elius.xyz` is already registered.) If the primary choice is taken, any of these can be used by changing the domain strings noted above.

After registering:

1. Point the domain's DNS at your host.
2. Enable HTTPS.
3. Keep the `CNAME` file if you deploy with GitHub Pages; other hosts use their own domain settings.

## Deploy

### GitHub Pages

1. Create a repository and push this folder.
2. In **Settings → Pages**, choose **Deploy from a branch** and select `main` / root.
3. The included `CNAME` file sets the custom domain to `elius.wiki`.
4. Enable **Enforce HTTPS** once DNS is configured.

### Cloudflare Pages, Netlify, or Vercel

- Connect the repository or upload the folder.
- Build command: none.
- Output directory: `.` (the project root).
- Add `elius.wiki` as a custom domain in the host's dashboard.

The site also works by opening `index.html` directly, though a local server is recommended so that absolute paths and the manifest behave normally.

## Privacy

The email address is deliberately public on this site because it was provided as a contact channel. It will be visible in the HTML source and can be scraped. If that becomes a problem, replace it with a contact form or an obfuscated address.

## Checks

```bash
node --check assets/js/wiki.js
node --check assets/js/search-index.js
python3 check_links.py
```

`check_links.py` verifies every local link, in-page fragment, duplicate ID, and required asset. The site was also checked in Chromium at 320–1440 px with no horizontal overflow, and all pages passed axe-core (WCAG 2.1 AA) in both light and dark themes.

Browser test with the installed Playwright CLI:

```bash
playwright-cli open http://localhost:8080
playwright-cli screenshot --filename=home.png
playwright-cli close
```

## Design

- Paper-and-ink palette, serif headings, sans-serif body.
- Responsive sidebar, client-side search with keyboard shortcuts, dark mode, print styles.
- Accessible: skip link, labelled controls, visible focus, reduced-motion support, high-contrast palette, focus-managed mobile drawer.
- No trackers, cookies, analytics, or third-party fonts.
- The `E` monogram is drawn in CSS; the favicon is `assets/img/favicon.svg`; `assets/img/og.png` is the social preview card.

## Notes

- The wiki is intentionally honest about empty sections. It does not invent a biography, a profession, or a history that was not provided.
- Instagram profile details were not scraped. The site links to the public profile using the handle provided.
- Text is maintained by Elius. Corrections go to the email above.
