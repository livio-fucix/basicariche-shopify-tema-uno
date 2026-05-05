if (!customElements.get('card-quick-add-inline')) {
  customElements.define(
    'card-quick-add-inline',
    class CardQuickAddInline extends HTMLElement {
      connectedCallback() {
        const dataNode = this.querySelector('script[data-card-variants]');
        try {
          this.variants = dataNode ? JSON.parse(dataNode.textContent) : [];
        } catch (e) {
          this.variants = [];
        }

        this.optionFieldsets = this.querySelectorAll('.card-quick-add-inline__option');
        this.variantInput = this.querySelector('[data-card-variant-id-input]');
        this.priceCurrent = this.querySelector('[data-card-price-current]');
        this.priceWrapper = this.querySelector('[data-card-price]');
        this.submitBtn = this.querySelector('[data-card-submit]');
        this.submitLabel = this.querySelector('[data-card-submit-label]');

        this.addEventListener('change', this.onOptionChange.bind(this));
      }

      currentSelection() {
        return Array.from(this.optionFieldsets).map((fs) => {
          const checked = fs.querySelector('input[type="radio"]:checked');
          return checked ? checked.value : null;
        });
      }

      findVariant(selection) {
        return this.variants.find((v) =>
          selection.every((val, i) => val === null || v.options[i] === val)
        );
      }

      onOptionChange() {
        const variant = this.findVariant(this.currentSelection());
        if (!variant) {
          this.setUnavailable();
          return;
        }
        this.applyVariant(variant);
      }

      applyVariant(variant) {
        if (this.variantInput) {
          this.variantInput.value = variant.id;
          if (variant.available) this.variantInput.removeAttribute('disabled');
          else this.variantInput.setAttribute('disabled', '');
        }

        if (this.priceCurrent) {
          this.priceCurrent.textContent = this.formatMoney(variant.price);
        }
        if (this.priceWrapper) {
          const oldCompare = this.priceWrapper.querySelector('.card-quick-add-inline__price-compare');
          if (oldCompare) oldCompare.remove();
          if (variant.compare_at_price && variant.compare_at_price > variant.price) {
            const s = document.createElement('s');
            s.className = 'card-quick-add-inline__price-compare';
            s.textContent = this.formatMoney(variant.compare_at_price);
            this.priceWrapper.insertBefore(s, this.priceCurrent);
          }
        }

        if (this.submitBtn) {
          if (variant.available) {
            this.submitBtn.removeAttribute('disabled');
            if (this.submitLabel) this.submitLabel.textContent = window.cardQuickAddStrings?.addToCart || 'Aggiungi al carrello';
          } else {
            this.submitBtn.setAttribute('disabled', '');
            if (this.submitLabel) this.submitLabel.textContent = window.cardQuickAddStrings?.soldOut || 'Esaurito';
          }
        }
      }

      setUnavailable() {
        if (this.variantInput) this.variantInput.setAttribute('disabled', '');
        if (this.submitBtn) {
          this.submitBtn.setAttribute('disabled', '');
          if (this.submitLabel) this.submitLabel.textContent = window.cardQuickAddStrings?.unavailable || 'Combinazione non disponibile';
        }
      }

      formatMoney(cents) {
        if (window.Shopify && typeof Shopify.formatMoney === 'function') {
          return Shopify.formatMoney(cents, window.Shopify.money_format || '${{amount}}');
        }
        return (cents / 100).toLocaleString(undefined, {
          style: 'currency',
          currency: window.Shopify?.currency?.active || 'EUR',
        });
      }

    }
  );
}
