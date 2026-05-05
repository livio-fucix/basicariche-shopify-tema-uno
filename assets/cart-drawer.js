/* Basicariche v2.0 — cart-drawer.js
   Custom element <bc-cart-drawer> + open/close API + AJAX line updates.

   Wires:
     - clicks on [data-bc-open-cart] → preventDefault, open drawer
     - clicks on [data-bc-drawer-close] → close drawer
     - bcEvents 'cart:added' (from product-form) → swap markup with response
       sections, update header count, open drawer
     - bcEvents 'cart:update-line' (from quantity-input) → AJAX /cart/change.js
       passing ?sections=cart-drawer,header → swap markup
*/

(() => {
  'use strict';

  if (!window.bcEvents) {
    // Defensive: theme.js MUST run before this file. If it didn't, fall back
    // to a tiny local bus so things don't crash.
    window.bcEvents = (() => {
      const m = new Map();
      return {
        on(e, cb) { (m.get(e) || m.set(e, new Set()).get(e)).add(cb); },
        emit(e, p) { (m.get(e) || []).forEach((cb) => cb(p)); },
      };
    })();
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

  // Replace the inner of an element with the inner of HTML matching a selector
  function swapInner(target, html, selector) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const fresh = tmp.querySelector(selector);
    if (fresh && target) {
      target.innerHTML = fresh.innerHTML;
    }
  }

  if (!customElements.get('bc-cart-drawer')) {
    customElements.define(
      'bc-cart-drawer',
      class extends HTMLElement {
        connectedCallback() {
          if (window.BC_DEBUG) console.log('[bc] cart-drawer connected');
          this.addEventListener('click', this.onClick.bind(this));
          document.addEventListener('keydown', this.onKey.bind(this));

          // Header "open cart" buttons (rebind every time, in case header
          // markup changes via section refresh)
          this.bindOpeners();

          window.bcEvents.on('cart:added', (payload) => this.onCartAdded(payload));
          window.bcEvents.on('cart:update-line', (p) => this.updateLine(p));
        }

        bindOpeners() {
          document.querySelectorAll('[data-bc-open-cart]').forEach((el) => {
            if (el.dataset.bcOpenCartBound === '1') return;
            el.dataset.bcOpenCartBound = '1';
            el.addEventListener('click', (e) => {
              e.preventDefault();
              this.open();
            });
          });
        }

        onClick(e) {
          if (e.target.closest('[data-bc-drawer-close]')) {
            this.close();
          }
        }

        onKey(e) {
          if (e.key === 'Escape' && this.isOpen()) this.close();
        }

        isOpen() {
          return this.classList.contains('is-open');
        }

        open() {
          if (window.BC_DEBUG) console.log('[bc] drawer.open()');
          this.classList.add('is-open');
          this.setAttribute('aria-hidden', 'false');
          this.style.pointerEvents = 'auto';

          // Belt-and-suspenders: also set inline styles on panel + overlay so
          // the drawer becomes visible even if for any reason the CSS rules
          // tied to .is-open don't take effect (cache, override, plugin).
          const panel = this.querySelector('.bc-drawer__panel');
          const overlay = this.querySelector('.bc-drawer__overlay');
          if (panel) panel.style.transform = 'translateX(0)';
          if (overlay) overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

          document.documentElement.style.overflow = 'hidden';
          requestAnimationFrame(() => this.querySelector('[data-bc-drawer-close]')?.focus());
        }

        close() {
          if (window.BC_DEBUG) console.log('[bc] drawer.close()');
          this.classList.remove('is-open');
          this.setAttribute('aria-hidden', 'true');
          this.style.pointerEvents = '';

          const panel = this.querySelector('.bc-drawer__panel');
          const overlay = this.querySelector('.bc-drawer__overlay');
          if (panel) panel.style.transform = '';
          if (overlay) overlay.style.backgroundColor = '';

          document.documentElement.style.overflow = '';
        }

        // ---- Cart events ----
        onCartAdded({ sections } = {}) {
          // Open immediately — perceived snappy UX
          this.open();
          if (sections && Object.keys(sections).length) {
            this.applySections(sections);
            // applySections replaces innerHTML, so re-assert the open inline
            // styles on the freshly rendered panel/overlay.
            this.assertOpenStyles();
          } else {
            // Fallback: re-fetch via Section API
            this.refresh().then(() => this.assertOpenStyles());
          }
        }

        assertOpenStyles() {
          const panel = this.querySelector('.bc-drawer__panel');
          const overlay = this.querySelector('.bc-drawer__overlay');
          if (panel) panel.style.transform = 'translateX(0)';
          if (overlay) overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }

        applySections(sections) {
          if (sections['cart-drawer']) {
            swapInner(this, sections['cart-drawer'], 'bc-cart-drawer');
            this.bindOpeners();
          }
          if (sections.header) {
            const targetHeader = document.querySelector('.bc-header');
            if (targetHeader) {
              swapInner(targetHeader, sections.header, '.bc-header');
              this.bindOpeners();
            }
          }
        }

        async refresh() {
          try {
            const res = await fetch(`${window.location.pathname}?sections=cart-drawer,header`, {
              headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) {
              const data = await res.json();
              this.applySections(data);
            } else {
              await this.refreshFromCartJs();
            }
          } catch (e) {
            await this.refreshFromCartJs();
          }
        }

        async refreshFromCartJs() {
          const res = await fetch('/cart.js');
          const cart = await res.json();
          this.renderCartFallback(cart);
        }

        renderCartFallback(cart) {
          // Best-effort in-place updates without section markup
          const titleEl = this.querySelector('[data-bc-cart-title]');
          if (titleEl) {
            titleEl.textContent = cart.item_count > 0
              ? (cart.item_count === 1 ? `Carrello, ${cart.item_count} prodotto` : `Carrello, ${cart.item_count} prodotti`)
              : 'Carrello';
          }
          const totalEl = this.querySelector('[data-bc-cart-total]');
          if (totalEl) totalEl.textContent = formatMoney(cart.total_price);

          const footer = this.querySelector('[data-bc-cart-footer]');
          if (footer) {
            if (cart.item_count > 0) footer.removeAttribute('hidden');
            else footer.setAttribute('hidden', '');
          }
          // Header count
          document.querySelectorAll('[data-bc-cart-count]').forEach((el) => {
            el.textContent = cart.item_count;
            el.classList.toggle('bc-header__cart-count--empty', cart.item_count === 0);
          });
        }

        async updateLine({ key, quantity }) {
          try {
            const res = await fetch('/cart/change.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
              body: JSON.stringify({
                id: key,
                quantity,
                sections: 'cart-drawer,header',
                sections_url: window.location.pathname,
              }),
            });
            if (!res.ok) throw new Error('change failed');
            const data = await res.json();
            if (data.sections) {
              this.applySections(data.sections);
            } else {
              await this.refresh();
            }
            window.bcEvents.emit('cart:changed', data);
          } catch (e) {
            window.location.reload();
          }
        }
      }
    );
  }

  // On the standalone cart page, qty changes submit the form
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.bc-cart-page__form input[name="updates[]"]').forEach((input) => {
      input.addEventListener('change', () => {
        input.form.submit();
      });
    });
  });
})();
