/* Basicariche v2.0 — theme.js
   Mobile nav toggle + tiny event bus + thumb gallery + utilities.

   To enable verbose logging in the console, run:
     window.BC_DEBUG = true
   then reload the page. */

(() => {
  'use strict';

  // ---- Tiny pub/sub for cart updates etc. ----
  const listeners = new Map();
  window.bcEvents = {
    on(event, cb) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(cb);
      if (window.BC_DEBUG) console.log('[bc] on', event);
      return () => listeners.get(event).delete(cb);
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (window.BC_DEBUG) console.log('[bc] emit', event, '→', set ? set.size + ' listeners' : '0 listeners');
      if (!set) return;
      for (const cb of set) cb(payload);
    },
  };

  // ---- Mobile nav ----
  document.querySelectorAll('[data-bc-mobile-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.getAttribute('aria-controls'));
      if (!target) return;
      const open = target.hasAttribute('hidden');
      if (open) {
        target.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        target.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // ---- Thumb gallery (PDP) ----
  const mainImg = document.querySelector('[data-bc-pdp-main]');
  if (mainImg) {
    document.querySelectorAll('[data-bc-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.dataset.bcThumbSrc;
        if (src) mainImg.src = src;
        document.querySelectorAll('[data-bc-thumb]').forEach((t) => t.classList.remove('bc-pdp__thumb--active'));
        thumb.classList.add('bc-pdp__thumb--active');
      });
    });
  }

  // ---- <bc-quantity-input> ----
  if (!customElements.get('bc-quantity-input')) {
    customElements.define(
      'bc-quantity-input',
      class extends HTMLElement {
        connectedCallback() {
          this.input = this.querySelector('[data-bc-qty-input]');
          if (!this.input) return;
          this.querySelectorAll('[data-bc-qty]').forEach((btn) => {
            btn.addEventListener('click', () => {
              const dir = btn.dataset.bcQty;
              const cur = parseInt(this.input.value, 10) || 0;
              const min = parseInt(this.input.min, 10) || 0;
              const next = dir === 'increment' ? cur + 1 : Math.max(min, cur - 1);
              if (next === cur) return;
              this.input.value = next;
              this.input.dispatchEvent(new Event('change', { bubbles: true }));
            });
          });
          // Auto-submit cart updates on cart page / drawer
          this.input.addEventListener('change', () => {
            const key = this.dataset.key;
            if (key) {
              window.bcEvents.emit('cart:update-line', { key, quantity: parseInt(this.input.value, 10) || 0 });
            }
          });
        }
      }
    );
  }
})();
