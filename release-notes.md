# Basicariche theme — release notes

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
