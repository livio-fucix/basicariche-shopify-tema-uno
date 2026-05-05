# Basicariche theme — release notes

## v1.3 — 2026-05-05 — uppa tile teardown

### Card prodotto: refactor completo
- Nuovo layout "uppa-tile": l'immagine vive dentro un tile colorato pieno
  (rosso / arancione / viola / grigio / oro), il body con titolo grande
  bold + subtitle + variant pills + prezzo + bottone carrello sta in
  area bianca sotto.
- Tipografia editoriale: titolo 1.9rem peso 800 con letter-spacing
  negativo, subtitle muted, prezzo bold 1.7rem.
- Triangolo NOVITÀ ingrandito a ~28% del lato del tile, in colore
  complementare (viola su rosso/oro/grigio, arancione su viola, ecc.).
- Hover: leggero zoom dell'immagine + brightness sul tile.
- Niente bordi, niente ombre, niente `card_style` legacy.

### Cart drawer: restyle uppa
- Header: "Carrello, 3 prodotti" (conteggio dinamico) in arancione.
- Quantità: box grigi chiari 34×34, separati, hit area mobile-friendly.
- Footer su sfondo avorio con totale grande, CTA primario "Vai al
  pagamento" in pill rosso pieno + CTA secondario outline rosso
  "Continua lo shopping" che chiude il drawer.

### Colore tile: tre meccanismi (in cascata)
1. **Metafield** `product.metafields.custom.card_color` con valore
   handle (`red`, `orange`, `purple`, `grey`, `gold`). Setup admin
   richiesto (vedi sotto).
2. **Tag** sul prodotto: `card-color-red` (o `card-color-purple`,
   ecc.). Più semplice del metafield, niente setup admin.
3. **Cycling automatico**: se nessuno dei due è impostato, i 5 colori
   si alternano in ordine sulla griglia. Funziona out-of-the-box.

### Setup metafield (opzionale, una tantum)

Se vuoi controllo fine sui colori dei tile:

1. Admin Shopify → **Settings → Custom data → Products**.
2. **Add definition**:
   - Name: `Card Color`
   - Namespace and key: `custom.card_color`
   - Type: **Single line text**
   - (Opzionale) Validations → List of values: `red, orange, purple, grey, gold`
3. **Save**.
4. Nei singoli prodotti vedrai un nuovo campo "Card Color" — assegnalo
   a piacere.

### Setup metafield blend (opzionale, foto su sfondo bianco fotografico)

Se le tue foto prodotto sono su sfondo bianco PURO e vuoi che
"sparisca" sul tile colorato (effetto cutout):

1. Admin → Settings → Custom data → Products → Add definition
   - Namespace+key: `custom.card_blend`
   - Type: Single line text
   - Validations: list `multiply, normal`
2. Setta `multiply` sui prodotti che lo richiedono.

### Default modificati
- Colonne griglia: 3 desktop / 1 mobile (era 4/2).
- Featured collection homepage: 6 prodotti, 3 colonne.
- Newsletter: già disabilitata in v1.2.

### Rollback
Se il nuovo look ti crea problemi su un prodotto specifico o vuoi
tornare al layout v1.2 senza scaricare nessun file:

1. Theme editor → **Theme settings → Product cards**.
2. Setta **Layout card prodotto: Legacy (Dawn classic)**.
3. Salva. La card torna alla versione v1.2 immediatamente.

### File modificati / aggiunti

- `snippets/card-product.liquid` — riscritto da zero (uppa-tile + dispatcher legacy)
- `snippets/card-product-legacy.liquid` — rinominato dal vecchio card-product, intatto
- `snippets/cart-drawer.liquid` — header con conteggio + bottone "Continua lo shopping"
- `assets/card-product-v2.css` — nuovo, tile + tipografia + ribbon + WCAG
- `assets/uppa-style.css` — esteso con override cart drawer
- `assets/card-quick-add-inline.css` — hit area mobile a 4.4rem
- `config/settings_schema.json` — setting `card_layout` + bump version 1.3
- `sections/main-collection-product-grid.liquid`, `featured-collection.liquid` — default 3/1
- `templates/index.json`, `templates/collection.json` — colonne 3/1
- `sections/footer.liquid` — label v1.3
- `.gitignore` + rimozione di `basicariche-theme.zip` dal repo (Shopify ora pesca da GitHub direttamente, lo zip non serve più)

## v1.2 — 2026-05-05

- Fix: clicking variant pills/swatches on product cards no longer
  navigates to the product page. The inline quick-add block now sits
  above Dawn's full-card click overlay (`z-index: 2`) so radios and
  the cart button capture clicks.
- Removed: newsletter signup is disabled by default (footer-group
  setting and section schema default).
- Added: `category-pills` section — a horizontal pill bar built from
  any Shopify navigation menu, included by default in the header
  group below the main header. Mobile-first with horizontal scroll.
- Added: theme version label in the footer copyright row.
- Palette refresh: red accent (#D2381F), navy secondary (#0F2F5C),
  ivory soft background (#FAF7F2), gold highlight (#F4C842). All
  text/background pairs verified at WCAG AA.
- Refactor: product cards now read as coloured ivory tiles with a
  centred image, bolder titles, muted subtitle/vendor lines, and an
  emphasised price. Card borders/shadows removed.

## v1.1 — 2026-05-05

- Fixed: inline quick-add was not visible on the catalogue / homepage
  because the `quick_add` setting fell back to the default `none`. The
  default is now `inline` and the bundled `templates/collection.json`
  and `templates/index.json` enable it explicitly.
- Theme info: renamed from Dawn to Basicariche, version bumped to 1.1.

## v1.0 — 2026-05-05

First production release based on Dawn 15.4.1.

- Inline quick-add on product cards (size pills, colour swatches,
  AJAX add-to-cart that opens the cart drawer).
- Uppa-inspired restyle: orange CTAs (#F26A1F), rounded buttons,
  navy pill nav, NOVITÀ corner ribbon, tinted announcement bar.
- Packaged as `basicariche-theme.zip` ready for direct upload from
  Shopify admin → Online Store → Themes → Add theme.
