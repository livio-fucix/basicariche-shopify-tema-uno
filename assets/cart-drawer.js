/* Basicariche v2.0 — cart-drawer.js
   Custom element <bc-cart-drawer> + open/close API + AJAX line updates.
   Listens to:
     - clicks on [data-bc-open-cart] (header cart link) -> open drawer (preventDefault)
     - clicks on [data-bc-drawer-close] -> close drawer
     - bcEvents 'cart:added' (from product-form) -> reload drawer markup
     - bcEvents 'cart:update-line' (from quantity-input) -> AJAX /cart/change
*/

(() => {
  'use strict';

  if (!window.bcEvents) {
    window.bcEvents = { on() {}, emit() {} };
  }

  const moneyFormat = window.Shopify?.money_format || '€{{amount}}';
  function formatMoney(cents) {
    if (window.Shopify && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(cents, moneyFormat);
    }
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'EUR',
    });
  }

  function pluralizeTitle(count) {
    return count === 1
      ? `Carrello, ${count} prodotto`
      : `Carrello, ${count} prodotti`;
  }

  if (!customElements.get('bc-cart-drawer')) {
    customElements.define(
      'bc-cart-drawer',
      class extends HTMLElement {
        connectedCallback() {
          this.addEventListener('click', this.onClick.bind(this));
          this.addEventListener('keydown', this.onKey.bind(this));

          // Header "open cart" buttons
          document.querySelectorAll('[data-bc-open-cart]').forEach((el) => {
            el.addEventListener('click', (e) => {
              e.preventDefault();
              this.open();
            });
          });

          window.bcEvents.on('cart:added', () => this.refresh().then(() => this.open()));
          window.bcEvents.on('cart:update-line', (p) => this.updateLine(p));
        }

        onClick(e) {
          if (e.target.closest('[data-bc-drawer-close]')) {
            this.close();
          }
        }

        onKey(e) {
          if (e.key === 'Escape') this.close();
        }

        open() {
          this.removeAttribute('hidden');
          this.classList.add('is-open');
          this.setAttribute('aria-hidden', 'false');
          document.documentElement.style.overflow = 'hidden';
          // Move focus to close button
          requestAnimationFrame(() => this.querySelector('[data-bc-drawer-close]')?.focus());
        }

        close() {
          this.classList.remove('is-open');
          this.setAttribute('aria-hidden', 'true');
          document.documentElement.style.overflow = '';
          // Hide after transition
          setTimeout(() => this.setAttribute('hidden', ''), 300);
        }

        async refresh() {
          // Re-fetch the cart drawer section using Shopify Section Rendering API.
          try {
            const res = await fetch(`${window.location.pathname}?sections=cart-drawer`, {
              headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
              const data = await res.json();
              if (data['cart-drawer']) {
                const tmp = document.createElement('div');
                tmp.innerHTML = data['cart-drawer'];
                const fresh = tmp.querySelector('bc-cart-drawer');
                if (fresh) {
                  this.innerHTML = fresh.innerHTML;
                }
              }
            } else {
              // Fallback: full reload of drawer via /cart.js
              await this.refreshFromCartJs();
            }
          } catch (e) {
            await this.refreshFromCartJs();
          }
          // Re-bind close buttons
          this.querySelectorAll('[data-bc-drawer-close]').forEach((el) => {
            el.addEventListener('click', () => this.close());
          });
          // Update header count
          this.updateHeaderCount();
        }

        async refreshFromCartJs() {
          const res = await fetch('/cart.js');
          const cart = await res.json();
          this.renderCart(cart);
        }

        renderCart(cart) {
          // Minimal in-place re-render if section API isn't available
          const titleEl = this.querySelector('[data-bc-cart-title]');
          if (titleEl) titleEl.textContent = cart.item_count > 0 ? pluralizeTitle(cart.item_count) : 'Carrello';

          const totalEl = this.querySelector('[data-bc-cart-total]');
          if (totalEl) totalEl.textContent = formatMoney(cart.total_price);

          const footer = this.querySelector('[data-bc-cart-footer]');
          if (footer) {
            if (cart.item_count > 0) footer.removeAttribute('hidden');
            else footer.setAttribute('hidden', '');
          }
        }

        updateHeaderCount() {
          fetch('/cart.js')
            .then((r) => r.json())
            .then((cart) => {
              document.querySelectorAll('[data-bc-cart-count]').forEach((el) => {
                el.textContent = cart.item_count;
                if (cart.item_count > 0) el.classList.remove('bc-header__cart-count--empty');
                else el.classList.add('bc-header__cart-count--empty');
              });
            });
        }

        async updateLine({ key, quantity }) {
          try {
            const res = await fetch('/cart/change.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: key, quantity }),
            });
            if (!res.ok) throw new Error('change failed');
            await this.refresh();
            // Notify other components (e.g. main cart page) to reload
            window.bcEvents.emit('cart:changed');
          } catch (e) {
            // Last resort: full page reload
            window.location.reload();
          }
        }
      }
    );
  }

  // On the dedicated cart page, react to qty changes by submitting the form
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.bc-cart-page__form input[name="updates[]"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.form.submit();
      });
    });
  });
})();
