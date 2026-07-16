# Proje durumu — Eren Özcan Portfolio

Bu dosya, portfolyo sitesi üzerinde yapılanları ve kalan işleri takip etmek için tutuluyor. Konuşma/oturum kapansa bile buradan devam edilebilir.

## Yapılanlar

- [x] Referans site (cobanov.dev) incelendi — minimalist, monospace, brutalist tarz
- [x] Statik site oluşturuldu: `index.html`, `style.css`, `script.js`
- [x] Bölümler: hero, projects, writing, open source, contact/footer
- [x] Açık/koyu tema toggle özelliği (localStorage ile hatırlanıyor)
- [x] CV eklendi: `assets/Eren_Ozcan_CV.pdf`, hero/nav/contact bölümlerine indirme linki kondu
- [x] Git reposu oluşturuldu ve GitHub'a push edildi: https://github.com/Eren-Ozcan/portfolio (public)
- [x] Tasarım cobanov.dev'e çok benzediği için baştan tasarlandı: gradient/bento-grid stil, Space Grotesk + Inter font, gradient avatar halkası, scroll-reveal animasyonları — artık brutalist/monospace değil
- [x] CV'den (`Eren_Özcan_CV (2).pdf`) gerçek bilgiler okunup siteye işlendi:
  - Hero: gerçek unvan (Junior Game Developer · Gameplay Programmer), gerçek özet, gerçek skill'ler, gerçek GitHub/LinkedIn/email linkleri
  - Yeni "Deneyim" bölümü eklendi: Etki-Academy (VR Developer), Safir Yazılım (SAP ABAP Intern), BLC Communication (Cloud Engineering Intern), Kocaeli University (Software Dev Intern)
  - Projeler: gerçek proje "Cosmic Rumble" (github.com/Eren-Ozcan/CosmicRumble) + GitHub profiline yönlendiren kart; placeholder projeler kaldırıldı
  - "Açık Kaynak" bölümü kaldırıldı (CV'de yayınlanmış paket yok), yerine gerçek "Eğitim" bölümü eklendi (Kocaeli University, BS Information Systems Engineering)
  - Yazılar bölümü placeholder başlıkları gerçek uzmanlık alanına göre güncellendi (hâlâ "hazırlanıyor" durumunda, gerçek yazı yok)
- [x] Hero arka planı joshwcomeau.com'daki bulut yapısıyla değiştirildi (tepeler kaldırıldı): gökyüzü degradesi + 2 katmanlı bulut bankı + sayfa arka planı renginde ön plan bulut zemini; SVG path'ler `C:\Benim Web Sitem` içindeki HTTrack kopyasından birebir alındı, gökkuşağı aynı yerde (avatara bağlı, bulutların arkasından yükseliyor)
- [x] CV güncellendi (`assets/Eren_Ozcan_CV.pdf`, Desktop'taki güncel PDF'den): Etki-Academy VR Developer rolü artık bitmiş görünüyor (Nisan 2023 – Nisan 2025, "Halen"/"Present" değil), açıklama geçmiş zamana çevrildi — TR/EN i18n string'leri (`script.js`) ve `index.html`'deki varsayılan metin birlikte güncellendi

## Yapılacaklar

### İçerik (kalan placeholder'lar)
- [ ] Yazılar bölümü: hâlâ "hazırlanıyor" — gerçek blog yazısı yazılınca link+tarih güncellenecek
- [ ] CV'deki telefon numarası bilinçli olarak siteye eklenmedi (spam riski) — istenirse contact bölümüne eklenebilir
- [ ] CV'de olmayan başka projeler varsa (ör. mobil app'ler) Projeler bölümüne eklenebilir — şu an sadece Cosmic Rumble var
- [ ] GitHub'daki diğer repolar (web-php, kulup-yonetim-sistemi, svelte-calender-app, KOUAI_YapayZeka_Python, vb.) küçük okul projeleri gibi görünüyor, portföyde öne çıkarılmadı

### Domain + Cloudflare Pages deploy
- [x] Domain satın alındı: `erenozcan.dev`, Spaceship üzerinden
- [x] Cloudflare hesabı oluşturuldu (GitHub ile giriş)
- [x] Spaceship'te nameserver'lar Cloudflare'ınkilerle değiştirildi: `luke.ns.cloudflare.com`, `stevie.ns.cloudflare.com`
- [x] Cloudflare Pages projesi oluşturuldu: proje adı `erenozcan-portfolio` (`portfolio` adı başkasına ait olduğu için), GitHub'da yalnızca `Eren-Ozcan/portfolio` reposuna erişim izni verildi
  - Framework preset: None
  - Build command: boş
  - Build output directory: /
  - `erenozcan-portfolio.pages.dev` adresine ilk deploy başarılı
- [x] Pages projesine custom domain bağlandı (`erenozcan.dev`), DNS yayılması tamamlandı — site artık `https://erenozcan.dev` üzerinden erişilebiliyor

## Notlar
- Deploy yöntemi olarak GitHub bağlantılı Cloudflare Pages seçildi (her `main` push'unda otomatik yeniden deploy olur)
- GitHub CLI zaten `Eren-Ozcan` hesabına bağlı ve authenticated durumda
- Detaylı deploy adımları için `README.md` dosyasına da bakılabilir
- Cloudflare Pages proje adı `erenozcan-portfolio` (fallback pages.dev adresi: `erenozcan-portfolio.pages.dev`), canlı domain: `erenozcan.dev`
