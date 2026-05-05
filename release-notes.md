# Basicariche theme — release notes

## v2.0.0 — 2026-05-05 — Riscrittura completa

Tema riscritto da zero, ignorando completamente la base Dawn.

### Perché
Le versioni 1.0–1.3 erano patch su Dawn. Risultato: codice patchwork, doppi
sistemi di classi, override globali, e un look che non riusciva mai ad
allontanarsi dall'estetica Dawn. La v2.0 azzera tutto e riparte con un
namespace pulito (`bc-*`) e un'architettura piccola.

### Architettura
- **40 file** circa contro i ~250 di Dawn (assets/sections/snippets/templates).
- **1 file CSS** unico (`base.css`, ~1000 righe) con reset + tokens + componenti.
- **3 file JS** (~600 righe complessive): `theme.js`, `cart-drawer.js`,
  `product-form.js`. Tutti web components vanilla, niente framework.
- **Tokens via CSS custom properties** definite in `<head>` direttamente da
  `settings.color_*` — il merchant cambia i colori in admin senza ricompilare.

### Funzionalità
- Header con pill nav (desktop) + drawer mobile, sticky on-scroll.
- Announcement bar configurabile.
- Category pills orizzontali con scroll snap su mobile.
- Image banner full-bleed.
- Featured collection griglia 3/1 (desktop/mobile).
- Card prodotto con immagine dominante, titolo bold, opzionale inline quick-add
  (variant pills + bottone carrello AJAX).
- PDP con galleria thumbnail, variant picker dedicato, AJAX add to cart.
- Cart drawer custom con AJAX line update via Section Rendering API.
- Pagina cart standalone (fallback).
- Search con risultati mixed (prodotti + pagine + articoli).
- Customer flow completo (login, register, account, addresses, order, reset).
- Contact form template.
- 404 dedicato.

### Cosa abbiamo lasciato fuori (rispetto a Dawn)
- Quick-add bulk B2B (non rilevante per questo store).
- Predictive search live.
- Country/language selector (i locales sono in repo, il picker no).
- Gift card template (Shopify ha fallback).
- Animations on scroll (rumore visivo che non aggiungeva valore).

### Per il merchant
Niente migrazione obbligatoria. Una volta caricato il tema, il theme editor
mostra i nuovi setting. Le sezioni del tema vecchio (`main-collection-product-grid`,
`featured-collection` Dawn-style ecc.) NON sono compatibili: i template
`templates/*.json` sono stati riscritti coerentemente. Eventuali blocchi
salvati a livello sezione vanno reinseriti a mano.

### Step migrazione
1. Bozza del nuovo tema appare su Shopify dopo che il branch è mergiato in `main`.
2. Verifica preview: home, una collezione, un prodotto, carrello, account.
3. Quando sei OK → Pubblica.
4. Vecchio tema resta come backup nei Draft themes per rollback.

---

## v1.3 — 2026-05-05 — uppa tile teardown (deprecata)
v1.0 – v1.3 erano patch su Dawn. La v2.0 le sostituisce tutte. Il codice è
preservato nella cronologia git ma non più utilizzato.
