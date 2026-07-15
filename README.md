# Eren Özcan — Portfolio

Kişisel portföy sitem. Statik HTML/CSS/JS — framework yok, build adımı yok. Cloudflare Pages üzerinde yayında; `main` branch'e her push otomatik deploy tetikler.

## Yerelde çalıştırma

`index.html` dosyasını doğrudan tarayıcıda açmak yeterli. İstenirse basit bir local server ile:

```
npx serve .
```

## Deploy (Cloudflare Pages)

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Bu repoyu seç
3. Build ayarları: **Framework preset: None**, **Build command:** boş, **Build output directory:** `/`
4. Her `main` push'unda otomatik yeniden deploy olur

## Custom domain

Cloudflare Pages projesi → Custom domains → Set up a custom domain. Domain Cloudflare'da yönetiliyorsa DNS kaydı otomatik eklenir.
