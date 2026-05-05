/* Basicariche v2.0 — product-form.js
   Custom elements:
     <bc-product-form>: variant-aware form, AJAX add to cart, fires 'cart:added'.
       Used both on the product card (collection) AND on the PDP main product section.
     <bc-pdp-variant-picker>: PDP-only variant picker (full size).
*/

(() => {
  'use strict';

  if (!window.bcEvents) window.bcEvents = { on() {}, emit() {} };

  function findVariant(variants, selection) {
    return variants.find((v) =>
      selection.every((val, i) => val === null || val === undefined || v.options[i] === val)
    );
  }

  function formatMoney(cents) {
    if (window.Shopify && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(cents, window.Shopify.money_format || '€{{amount}}');
    }
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'EUR',
    });
  }

  // ---- <bc-product-form> ----
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
          this.variantInput = this.querySelector('[data-bc-variant-id]') || this.querySelector('[data-bc-pdp-variant-id]');
          this.submit = this.querySelector('[data-bc-submit]');
          this.label = this.querySelector('[data-bc-cta-label]');
          this.optionFieldsets = this.querySelectorAll('[data-bc-option-position]');
          this.priceBlock = document.querySelector('[data-bc-pdp-price]');

          this.addEventListener('change', this.onChange.bind(this));
          if (this.form) this.form.addEventListener('submit', this.onSubmit.bind(this));
        }

        currentSelection() {
          return Array.from(this.optionFieldsets).map((fs) => {
            const checked = fs.querySelector('input[type="radio"]:checked');
            return checked ? checked.value : null;
          });
        }

        onChange() {
          if (!this.optionFieldsets.length) return;
          const selection = this.currentSelection();
          const variant = findVariant(this.variants, selection);
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

          // Update card price (inline) or PDP price block
          const cardPrice = this.querySelector('.bc-card__price');
          if (cardPrice) {
            cardPrice.innerHTML = '';
            const wrap = document.createElement('span');
            wrap.className = 'bc-price' + (variant.compare_at_price > variant.price ? ' bc-price--on-sale' : '');
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
            // PDP price update
            const pdpPrice = this.priceBlock.querySelector('.bc-price');
            if (pdpPrice) {
              pdpPrice.classList.toggle('bc-price--on-sale', variant.compare_at_price > variant.price);
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
              } else if (compare) {
                compare.remove();
              }
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
          if (!this.submit || this.submit.hasAttribute('disabled')) return;
          this.submit.classList.add('is-loading');
          this.submit.setAttribute('aria-busy', 'true');
          this.submit.setAttribute('disabled', '');

          const fd = new FormData(this.form);
          // Ask Shopify to also re-render the cart drawer + header in the same
          // round trip via the Section Rendering API.
          fd.append('sections', 'cart-drawer,header');
          fd.append('sections_url', window.location.pathname);

          try {
            const res = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
              method: 'POST',
              headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
              body: fd,
            });
            const json = await res.json();

            if (!res.ok) {
              this.handleError(json);
              return;
            }

            // Success — fire event with rendered sections so the drawer can
            // swap its markup without a second network call.
            window.bcEvents.emit('cart:added', { item: json, sections: json.sections || {} });
            // Re-enable the button (the drawer takes focus next)
            this.submit.removeAttribute('disabled');
            if (this.label) this.label.textContent = '✓';
            setTimeout(() => {
              if (this.label) this.label.textContent = 'Aggiungi al carrello';
            }, 1500);
          } catch (err) {
            console.error('add to cart error', err);
            // Fallback: navigate to cart page
            window.location.href = window.routes?.cart_url || '/cart';
          } finally {
            this.submit.classList.remove('is-loading');
            this.submit.removeAttribute('aria-busy');
            this.submit.removeAttribute('disabled');
          }
        }

        handleError(json) {
          // Show inline error in label
          if (this.label) this.label.textContent = json.description || 'Errore — riprova';
          this.submit?.setAttribute('disabled', '');
          setTimeout(() => {
            this.submit?.removeAttribute('disabled');
            if (this.label) this.label.textContent = 'Aggiungi al carrello';
          }, 2000);
        }
      }
    );
  }

  // ---- <bc-pdp-variant-picker> shares the same change-event flow ----
  // The actual variant-id input lives inside the same <bc-product-form>,
  // so when this picker is nested in <bc-product-form> on the PDP, change events
  // bubble up and apply via the host.
  if (!customElements.get('bc-pdp-variant-picker')) {
    customElements.define('bc-pdp-variant-picker', class extends HTMLElement {});
  }
})();
