# Basicariche Shopify theme

Tema Shopify scritto da zero per **Basi Cariche**, un negozio di attrezzatura
da baseball. Versione corrente: **2.0.0**.

Questa è una **riscrittura completa** che NON deriva più da Dawn. Tutto il
markup, CSS e JS è scritto dentro questo repo con un namespace dedicato
(`bc-*`) per evitare conflitti con framework e ridurre la complessità.

## Filosofia

- **Mobile-first**: tutto il CSS parte dai breakpoint piccoli verso l'alto.
- **HTML-first, JS solo dove serve**: web components vanilla, niente framework, niente bundler.
- **Coerenza visiva**: una sola palette gestita via CSS custom properties (`--bc-*`)
  con override possibili dal theme editor.
- **Accessibilità**: focus visibile, hit target ≥44px, WCAG AA verificato sui
  colori principali, struttura semantica corretta (header/main/footer, ARIA labels).
- **Performance**: nessun caricamento di librerie esterne, immagini con
  `srcset`/`sizes`, Section Rendering API per il cart drawer.

## Struttura

```
assets/
  base.css          → reset + tokens + tutti i componenti
  theme.js          → bus eventi, mobile nav, gallery PDP, <bc-quantity-input>
  cart-drawer.js    → <bc-cart-drawer>, AJAX cart updates, Section API refresh
  product-form.js   → <bc-product-form>, variant picker, AJAX add-to-cart
config/
  settings_schema.json + settings_data.json
layout/
  theme.liquid
locales/
  en.default.json, en.default.schema.json, it.json
sections/
  header, footer, announcement-bar, category-pills, header-group, footer-group
  image-banner, featured-collection, rich-text
  main-collection, main-product, main-cart, main-page, main-search, main-404
  main-customer, contact-form
snippets/
  card-product, cart-drawer, variant-picker, price, icon, meta-tags
templates/
  index, collection, product, cart, page, page.contact, search, 404
  customers/{login, register, account, addresses, order, reset_password, activate_account}
```

## Personalizzazione (theme editor)

Theme settings:

1. **Brand** — logo, larghezza logo, favicon
2. **Colori** — sfondo, surface, testo, muted, accent (rosso CTA), accent text,
   secondary (navy), highlight (oro per ribbon)
3. **Tipografia** — body font, heading font, scala globale
4. **Layout** — larghezza pagina, spacing tra sezioni
5. **Carrello** — drawer vs page, mostra nota
6. **Card prodotto** — vendor, seconda immagine al hover, quick-add inline

## Sviluppo locale

```bash
npm install -g @shopify/cli @shopify/theme
shopify theme dev --store tuo-store.myshopify.com
shopify theme push --unpublished
```

Il sito live è collegato a GitHub direttamente: ogni push sul branch tracciato
si propaga al tema Shopify (configurato dall'admin via "Connect from GitHub").

## Branching

- `main` → live
- `claude/shopify-theme-analysis-d0Nu1` → branch di sviluppo

## Licenza

MIT — vedi [LICENSE.md](LICENSE.md).
