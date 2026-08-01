# Project status — Eren Özcan Portfolio

This file tracks what's been done and what's left on the portfolio site. Work can resume from here even after a conversation/session ends.

## Done

- [x] Reviewed reference site (cobanov.dev) — minimalist, monospace, brutalist style
- [x] Static site built: `index.html`, `style.css`, `script.js`
- [x] Sections: hero, projects, writing, open source, contact/footer
- [x] Light/dark theme toggle (remembered via localStorage)
- [x] CV added: `assets/Eren_Ozcan_CV.pdf`, download link placed in hero/nav/contact sections
- [x] Git repo created and pushed to GitHub: https://github.com/Eren-Ozcan/portfolio (public)
- [x] Redesigned from scratch since it looked too close to cobanov.dev: gradient/bento-grid style, Space Grotesk + Inter fonts, gradient avatar ring, scroll-reveal animations — no longer brutalist/monospace
- [x] Real info from the CV (`Eren_Özcan_CV (2).pdf`) read and worked into the site:
  - Hero: real title (Junior Game Developer · Gameplay Programmer), real summary, real skills, real GitHub/LinkedIn/email links
  - New "Experience" section added: Etki-Academy (VR Developer), Safir Yazılım (SAP ABAP Intern), BLC Communication (Cloud Engineering Intern), Kocaeli University (Software Dev Intern)
  - Projects: real project "Cosmic Rumble" (github.com/Eren-Ozcan/CosmicRumble) + a card linking to the GitHub profile; placeholder projects removed
  - "Open Source" section removed (no published package in the CV), replaced with a real "Education" section (Kocaeli University, BS Information Systems Engineering)
  - Writing section's placeholder titles updated to match real areas of expertise (still marked "coming soon" — no real posts yet)
- [x] Hero background replaced with the cloud structure from joshwcomeau.com (hills removed): sky gradient + 2-layer cloud bank + foreground cloud floor in the page background color; SVG paths taken exactly from the HTTrack copy in `C:\Benim Web Sitem`, rainbow in the same spot (anchored to the avatar, rising from behind the clouds)
- [x] CV updated (`assets/Eren_Ozcan_CV.pdf`, from the current PDF on Desktop): the Etki-Academy VR Developer role now shows as finished (April 2023 – April 2025, not "Present"), description switched to past tense — the TR/EN i18n strings (`script.js`) and the default text in `index.html` were both updated

## To do

### Content (remaining placeholders)
- [ ] Writing section: still "coming soon" — link+date will be updated once a real blog post exists
- [ ] The phone number from the CV was deliberately left off the site (spam risk) — can be added to the contact section if wanted
- [ ] If there are other projects not in the CV (e.g. mobile apps), they can be added to the Projects section — only Cosmic Rumble is there for now
- [ ] Other repos on GitHub (web-php, kulup-yonetim-sistemi, svelte-calender-app, KOUAI_YapayZeka_Python, etc.) look like small school projects, not featured in the portfolio

### Domain + Cloudflare Pages deploy
- [x] Domain purchased: `erenozcan.dev`, via Spaceship
- [x] Cloudflare account created (signed in with GitHub)
- [x] Nameservers switched to Cloudflare's on Spaceship: `luke.ns.cloudflare.com`, `stevie.ns.cloudflare.com`
- [x] Cloudflare Pages project created: project name `erenozcan-portfolio` (since `portfolio` was taken), access on GitHub granted only to the `Eren-Ozcan/portfolio` repo
  - Framework preset: None
  - Build command: empty
  - Build output directory: /
  - First deploy to `erenozcan-portfolio.pages.dev` succeeded
- [x] Custom domain connected to the Pages project (`erenozcan.dev`), DNS propagation complete — site is now reachable at `https://erenozcan.dev`

## Notes
- GitHub-connected Cloudflare Pages was chosen as the deploy method (automatic redeploy on every `main` push)
- GitHub CLI is already authenticated against the `Eren-Ozcan` account
- See `README.md` for detailed deploy steps too
- Cloudflare Pages project name is `erenozcan-portfolio` (fallback pages.dev address: `erenozcan-portfolio.pages.dev`), live domain: `erenozcan.dev`
