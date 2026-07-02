# Proje durumu — Eren Özcan Portfolio

Bu dosya, portfolyo sitesi üzerinde yapılanları ve kalan işleri takip etmek için tutuluyor. Konuşma/oturum kapansa bile buradan devam edilebilir.

## Yapılanlar

- [x] Referans site (cobanov.dev) incelendi — minimalist, monospace, brutalist tarz
- [x] Statik site oluşturuldu: `index.html`, `style.css`, `script.js`
- [x] Bölümler: hero, projects, writing, open source, contact/footer
- [x] Açık/koyu tema toggle özelliği (localStorage ile hatırlanıyor)
- [x] CV eklendi: `assets/Eren_Ozcan_CV.pdf`, hero/nav/contact bölümlerine indirme linki kondu
- [x] Git reposu oluşturuldu ve GitHub'a push edildi: https://github.com/Eren-Ozcan/portfolio (public)

## Yapılacaklar

### İçerik (placeholder'ların doldurulması)
- [ ] Gerçek GitHub / LinkedIn / X kullanıcı adları ve email — şu an `your-github`, `your-linkedin`, `your-x`, `eren@example.com` placeholder
- [ ] Projeler bölümü: 4 örnek proje kartı yerine gerçek oyun/mobil projeler (isim, açıklama, teknoloji, repo/store linki)
- [ ] Yazılar bölümü: şu an "hazırlanıyor" — gerçek blog yazısı eklenince link+tarih güncellenecek
- [ ] Açık Kaynak bölümü: gerçek paylaşılan repo yoksa bu bölüm silinebilir, varsa gerçek paket bilgileriyle doldurulacak

### Domain + Cloudflare Pages deploy
- [ ] Domain satın al (öneri: `erenozcan.dev` veya `.com`, Cloudflare Registrar üzerinden alınması kar marjı olmadığı için avantajlı)
- [ ] Cloudflare hesabı oluştur (dash.cloudflare.com)
- [ ] Domain başka bir sağlayıcıdan alındıysa nameserver'ları Cloudflare'ın verdiği adreslerle değiştir
- [ ] Cloudflare Pages projesi oluştur: Workers & Pages → Create → Pages → Connect to Git → `Eren-Ozcan/portfolio` reposunu seç
  - Framework preset: None
  - Build command: boş
  - Build output directory: /
- [ ] Pages projesine custom domain bağla (Custom domains → Set up a custom domain)

## Notlar
- Deploy yöntemi olarak GitHub bağlantılı Cloudflare Pages seçildi (her `main` push'unda otomatik yeniden deploy olur)
- GitHub CLI zaten `Eren-Ozcan` hesabına bağlı ve authenticated durumda
- Detaylı deploy adımları için `README.md` dosyasına da bakılabilir
