/* Basicariche v2.0.x — product-form.js
   Direct cart-drawer reference (no event bus indirection).
   Permanent diagnostic logging.

   Custom elements:
     <bc-product-form>      : variant-aware form, AJAX add to cart, then
                              calls drawer.open(response) DIRECTLY.
     <bc-pdp-variant-picker>: PDP variant picker (just a marker; change
                              events bubble up to the host bc-product-form).
*/

(() => {
  'use strict';

  const log = (...args) => console.log('[bc-form]', ...args);

  function findVariant(variants, selection) {
    return variants.find((v) =>
      selection.every(
        (val, i) => val === null || val === undefined || v.options[i] === val
      )
    );
  }

  function formatMoney(cents) {
    if (window.Shopify && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(
        cents,
        window.Shopify.money_format || '€{{amount}}'
      );
    }
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'EUR',
    });
  }

  function getCartDrawer() {
    return (
      window.bcCartDrawer ||
      document.querySelector('bc-cart-drawer') ||
      null
    );
  }

  if (!customElements.get('bc-product-form')) {
    customElements.define(
      'bc-product-form',
      class extends HTMLElement {
        connectedCallback() {
          const dataNode = this.querySelector('[data-bc-variants]');
          try {
            this.variants = dataNode ? JSON.parse(dataNode.textContent) : [];
          } catch {
            this.variants = [];
          }
          this.form = this.querySelector('[data-bc-form]');
          this.variantInput =
            this.querySelector('[data-bc-variant-id]') ||
            this.querySelector('[data-bc-pdp-variant-id]');
          this.submit = this.querySelector('[data-bc-submit]');
          this.label = this.querySelector('[data-bc-cta-label]');
          this.optionFieldsets = this.querySelectorAll('[data-bc-option-position]');
          this.priceBlock = document.querySelector('[data-bc-pdp-price]');

          if (!this.form) {
            console.error(
              '[bc-form] CRITICAL: form not found inside <bc-product-form>',
              this
            );
            return;
          }

          this.addEventListener('change', this.onChange.bind(this));
          this.form.addEventListener('submit', this.onSubmit.bind(this));
        }

        currentSelection() {
          return Array.from(this.optionFieldsets).map((fs) => {
            const checked = fs.querySelector('input[type="radio"]:checked');
            return checked ? checked.value : null;
          });
        }

        onChange() {
          if (!this.optionFieldsets.length) return;
          const variant = findVariant(this.variants, this.currentSelection());
          if (!variant) return this.markUnavailable();
          this.applyVariant(variant);
        }

        applyVariant(variant) {
          if (this.variantInput) this.variantInput.value = variant.id;

          // Update PDP option display labels
          this.querySelectorAll('[data-bc-option-display]').forEach((el) => {
            const idx = parseInt(el.dataset.bcOptionDisplay, 10);
            const fs = this.querySelectorAll('[data-bc-option-position]')[idx];
            const checked = fs?.querySelector('input[type="radio"]:checked');
            if (checked) el.textContent = checked.value;
          });

          // Update card or PDP price
          const cardPrice = this.querySelector('.bc-card__price');
          if (cardPrice) {
            cardPrice.innerHTML = '';
            const wrap = document.createElement('span');
            wrap.className =
              'bc-price' +
              (variant.compare_at_price > variant.price ? ' bc-price--on-sale' : '');
            if (variant.compare_at_price && variant.compare_at_price > variant.price) {
              const s = document.createElement('span');
              s.className = 'bc-price__compare';
              s.textContent = formatMoney(variant.compare_at_price);
              wrap.appendChild(s);
            }
            const cur = document.createElement('span');
            cur.className = 'bc-price__current';
            cur.textContent = formatMoney(variant.price);
            wrap.appendChild(cur);
            cardPrice.appendChild(wrap);
          } else if (this.priceBlock) {
            const pdpPrice = this.priceBlock.querySelector('.bc-price');
            if (pdpPrice) {
              pdpPrice.classList.toggle(
                'bc-price--on-sale',
                variant.compare_at_price > variant.price
              );
              const compare = pdpPrice.querySelector('.bc-price__compare');
              const current = pdpPrice.querySelector('.bc-price__current');
              if (current) current.textContent = formatMoney(variant.price);
              if (variant.compare_at_price && variant.compare_at_price > variant.price) {
                if (compare) compare.textContent = formatMoney(variant.compare_at_price);
                else {
                  const s = document.createElement('span');
                  s.className = 'bc-price__compare';
                  s.textContent = formatMoney(variant.compare_at_price);
                  pdpPrice.insertBefore(s, current);
                }
              } else if (compare) compare.remove();
            }
          }

          if (this.submit) {
            if (variant.available) {
              this.submit.removeAttribute('disabled');
              if (this.label) this.label.textContent = 'Aggiungi al carrello';
            } else {
              this.submit.setAttribute('disabled', '');
              if (this.label) this.label.textContent = 'Esaurito';
            }
          }
        }

        markUnavailable() {
          if (this.submit) {
            this.submit.setAttribute('disabled', '');
            if (this.label) this.label.textContent = 'Non disponibile';
          }
        }

        async onSubmit(e) {
          e.preventDefault();
          log('form submit intercepted');

          if (!this.submit) return;
          if (this.submit.hasAttribute('disabled') && !this.submit.classList.contains('is-loading')) {
            log('submit disabled, ignoring');
            return;
          }

          this.submit.classList.add('is-loading');
          this.submit.setAttribute('aria-busy', 'true');
          this.submit.setAttribute('disabled', '');

          const fd = new FormData(this.form);
          // Section Rendering API: ask Shopify to also render these sections
          // in the response. /cart/add.js supports this since 2022-04 API.
          fd.append('sections', 'cart-drawer,header');
          fd.append('sections_url', window.location.pathname);

          log('POST /cart/add.js', {
            id: fd.get('id'),
            qty: fd.get('quantity'),
          });

          try {
            const res = await fetch(
              (window.routes && window.routes.cart_add_url) || '/cart/add.js',
              {
                method: 'POST',
                headers: {
                  'X-Requested-With': 'XMLHttpRequest',
                  Accept: 'application/json',
                },
                body: fd,
              }
            );
            const json = await res.json();
            log('/cart/add.js response', res.status, json);

            if (!res.ok || json.status) {
              this.handleError(json);
              return;
            }

            // Direct call: no event bus indirection.
            const drawer = getCartDrawer();
            if (drawer && typeof drawer.open === 'function') {
              log('calling drawer.open() directly');
              drawer.open(json);
            } else {
              log('no drawer present, navigating to /cart');
              window.location.href = '/cart';
              return;
            }

            this.flashSuccess();
          } catch (err) {
            console.error('[bc-form] add-to-cart error', err);
            this.handleError({ description: 'Errore di rete — riprova' });
            // Do NOT navigate away. Try to refresh drawer with current cart.
            const drawer = getCartDrawer();
            if (drawer) drawer.refresh().catch(() => {});
          } finally {
            this.submit.classList.remove('is-loading');
            this.submit.removeAttribute('aria-busy');
            this.submit.removeAttribute('disabled');
          }
        }

        flashSuccess() {
          if (!this.label) return;
          const original = this.label.textContent;
          this.label.textContent = 'Aggiunto ✓';
          setTimeout(() => {
            this.label.textContent = original;
          }, 1500);
        }

        handleError(json) {
          const msg =
            (json && (json.description || json.message)) || 'Errore — riprova';
          if (this.label) this.label.textContent = msg.slice(0, 60);
          this.submit?.setAttribute('disabled', '');
          setTimeout(() => {
            this.submit?.removeAttribute('disabled');
            if (this.label) this.label.textContent = 'Aggiungi al carrello';
          }, 3000);
        }
      }
    );
  }

  if (!customElements.get('bc-pdp-variant-picker')) {
    customElements.define('bc-pdp-variant-picker', class extends HTMLElement {});
  }
})();
