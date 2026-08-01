# Eren Özcan — Portfolio

My personal portfolio site. Static HTML/CSS/JS — no framework, no build step. Live on Cloudflare Pages; every push to `main` triggers an automatic deploy.

## Running locally

Just open `index.html` directly in a browser. Or, with a simple local server:

```
npx serve .
```

## Deploy (Cloudflare Pages)

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Select this repo
3. Build settings: **Framework preset: None**, **Build command:** empty, **Build output directory:** `/`
4. Every push to `main` triggers an automatic redeploy

## Custom domain

Cloudflare Pages project → Custom domains → Set up a custom domain. If the domain is managed in Cloudflare, the DNS record is added automatically.
