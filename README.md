# Eren Özcan — Portfolio

Kişisel portföy sitesi. Statik HTML/CSS/JS, framework yok.

## Yerelde çalıştırma

`index.html` dosyasını doğrudan tarayıcıda açman yeterli. İstersen basit bir local server ile de açabilirsin:

```
npx serve .
```

## Cloudflare Pages'e deploy

1. Bu repo GitHub'a bağlı: https://github.com/Eren-Ozcan/portfolio
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
3. `portfolio` reposunu seç
4. Build ayarları: **Framework preset: None**, **Build command: (boş bırak)**, **Build output directory: /**
5. Deploy'a bas — her `main` branch'e push'ta otomatik yeniden deploy olur

## Custom domain bağlama

1. Cloudflare Pages projesinde → Custom domains → Set up a custom domain
2. Domain zaten Cloudflare'da yönetiliyorsa DNS kaydı otomatik eklenir
3. Değilse domain sağlayıcında nameserver'ları Cloudflare'ın verdiği adreslerle değiştirmen gerekir

## Düzenlenmesi gereken placeholder'lar

- `index.html` içindeki GitHub / LinkedIn / X / email linkleri
- Projeler, Yazılar ve Açık Kaynak bölümlerindeki örnek içerikler
