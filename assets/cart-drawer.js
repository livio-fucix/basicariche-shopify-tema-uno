/* Basicariche v2.0.x — cart-drawer.js
   Dawn-inspired pattern (the ugly-but-working blueprint).

   Public API on the <bc-cart-drawer> instance (also exposed on
   window.bcCartDrawer for direct access from product-form):
     - open(response?) : opens the drawer; if response from /cart/add.js
       contains rendered sections, swaps the markup BEFORE animating in.
     - close()        : slides the panel out and unlocks body scroll.
     - refresh()      : pulls fresh markup via Section Rendering API.

   Listens to bcEvents 'cart:update-line' (from <bc-quantity-input>).
   No longer listens to 'cart:added' — product-form calls open() directly.

   Logging is permanent (not gated by BC_DEBUG). It will be removed once
   the open-on-add flow is confirmed working in production.
*/

(() => {
  'use strict';

  if (!window.bcEvents) {
    // theme.js MUST run before this script. Defensive fallback.
    window.bcEvents = {
      _m: new Map(),
      on(e, cb) {
        const set = this._m.get(e) || this._m.set(e, new Set()).get(e);
        set.add(cb);
      },
      emit(e, p) {
        const set = this._m.get(e);
        if (!set) return;
        set.forEach((cb) => cb(p));
      },
    };
  }

  const log = (...args) => console.log('[bc-cart]', ...args);

  if (!customElements.get('bc-cart-drawer')) {
    customElements.define(
      'bc-cart-drawer',
      class extends HTMLElement {
        connectedCallback() {
          log('connected');
          window.bcCartDrawer = this;

          this.addEventListener('click', this.onClick.bind(this));
          document.addEventListener('keydown', this.onKey.bind(this));

          this.bindOpeners();

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
          if (e.key === 'Escape' && this.classList.contains('is-open')) {
            this.close();
          }
        }

        // ---- Open ----
        // The Dawn pattern: swap markup synchronously, then add the class
        // inside a setTimeout so the browser performs a reflow between the
        // DOM mutation and the class toggle. This guarantees the panel's
        // transform transition fires from translateX(100%) → translateX(0).
        open(response) {
          log('open()', response ? 'with response' : 'plain');

          if (response && response.sections) {
            this.applySections(response.sections);
          }

          document.body.classList.add('bc-no-scroll');
          this.setAttribute('aria-hidden', 'false');

          // Wait one tick so any innerHTML swap settles, then trigger the
          // CSS transition.
          setTimeout(() => {
            this.classList.add('is-open');
            log('is-open class added');
          }, 0);

          // Move focus once the slide-in completes.
          this.addEventListener(
            'transitionend',
            () => {
              const closeBtn = this.querySelector('[data-bc-drawer-close]');
              if (closeBtn) closeBtn.focus();
              log('focused close button');
            },
            { once: true }
          );
        }

        close() {
          log('close()');
          this.classList.remove('is-open');
          this.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('bc-no-scroll');
        }

        // ---- Section markup application ----
        applySections(sections) {
          log('applySections', Object.keys(sections));

          // Cart drawer body: swap inner of <bc-cart-drawer>
          if (sections['cart-drawer']) {
            const tmp = document.createElement('div');
            tmp.innerHTML = sections['cart-drawer'];
            const fresh = tmp.querySelector('bc-cart-drawer');
            if (fresh) {
              this.innerHTML = fresh.innerHTML;
              log('cart-drawer markup swapped');
            }
          }

          // Header: surgically update only the cart count number, NOT the
          // whole header. Replacing the whole header would tear out
          // listeners attached by other scripts (mobile nav toggle, etc.).
          if (sections.header) {
            const tmp = document.createElement('div');
            tmp.innerHTML = sections.header;
            const newCount = tmp.querySelector('[data-bc-cart-count]');
            const liveCount = document.querySelector('[data-bc-cart-count]');
            if (newCount && liveCount) {
              const n = newCount.textContent.trim();
              liveCount.textContent = n;
              const empty = !n || n === '0';
              liveCount.classList.toggle('bc-header__cart-count--empty', empty);
              log('header count →', n);
            }
          }
        }

        // ---- Refresh from Section API (used as fallback) ----
        async refresh() {
          log('refresh()');
          try {
            const res = await fetch(
              `${window.location.pathname}?sections=cart-drawer,header`,
              { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );
            if (!res.ok) throw new Error('refresh failed: ' + res.status);
            const data = await res.json();
            this.applySections(data);
          } catch (err) {
            log('refresh error', err);
          }
        }

        // ---- Quantity update from drawer / cart page ----
        async updateLine({ key, quantity }) {
          log('updateLine', key, quantity);
          try {
            const res = await fetch('/cart/change.js', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
              body: JSON.stringify({
                id: key,
                quantity,
                sections: 'cart-drawer,header',
                sections_url: window.location.pathname,
              }),
            });
            if (!res.ok) throw new Error('change failed');
            const data = await res.json();
            if (data.sections) this.applySections(data.sections);
            else await this.refresh();
            window.bcEvents.emit('cart:changed', data);
          } catch (e) {
            log('updateLine error', e);
            window.location.reload();
          }
        }
      }
    );
  }

  // On the standalone cart page, qty changes submit the form
  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('.bc-cart-page__form input[name="updates[]"]')
      .forEach((input) => {
        input.addEventListener('change', () => input.form && input.form.submit());
      });
  });
})();
