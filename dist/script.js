const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const cartPanel = document.querySelector('.cart-panel');
const backdrop = document.querySelector('.panel-backdrop');
const cartItemsElement = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartSummary = document.querySelector('.cart-summary');
const checkoutModal = document.querySelector('.checkout-modal');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutFormView = document.querySelector('.checkout-form-view');
const checkoutSuccess = document.querySelector('.checkout-success');
const toast = document.querySelector('.toast');
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

let cart = loadCart();
let lastFocusedElement = null;
let toastTimer;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('meiaLuaCart'));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('meiaLuaCart', JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartCount() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toast.setAttribute('aria-hidden', 'false');
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.setAttribute('aria-hidden', 'true');
  }, 1900);
}

function updateCartUi() {
  const count = getCartCount();
  const total = getCartTotal();

  document.querySelectorAll('.cart-count').forEach((element) => {
    element.textContent = count;
    element.setAttribute('aria-label', `${count} ${count === 1 ? 'item' : 'itens'}`);
  });
  document.querySelectorAll('.cart-total').forEach((element) => {
    element.textContent = currency.format(total);
  });

  cartItemsElement.replaceChildren();
  cartEmpty.hidden = cart.length > 0;
  cartSummary.hidden = cart.length === 0;

  cart.forEach((item) => {
    const line = document.createElement('article');
    line.className = 'cart-line';

    const name = document.createElement('h3');
    name.textContent = item.name;
    const price = document.createElement('strong');
    price.className = 'cart-line-price';
    price.textContent = currency.format(item.price * item.quantity);

    const quantity = document.createElement('div');
    quantity.className = 'quantity-control';
    quantity.setAttribute('aria-label', `Quantidade de ${item.name}`);

    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.action = 'decrease';
    decrease.dataset.id = item.id;
    decrease.setAttribute('aria-label', `Diminuir ${item.name}`);
    decrease.textContent = '−';

    const amount = document.createElement('span');
    amount.textContent = item.quantity;

    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.action = 'increase';
    increase.dataset.id = item.id;
    increase.setAttribute('aria-label', `Aumentar ${item.name}`);
    increase.textContent = '+';

    quantity.append(decrease, amount, increase);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-item';
    remove.dataset.action = 'remove';
    remove.dataset.id = item.id;
    remove.textContent = 'Remover';

    line.append(name, price, quantity, remove);
    cartItemsElement.append(line);
  });
}

function addToCart(button) {
  const id = button.dataset.id;
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name: button.dataset.name, price: Number(button.dataset.price), quantity: 1 });
  }

  button.classList.add('is-added');
  button.textContent = 'Adicionado ✓';
  window.setTimeout(() => {
    button.classList.remove('is-added');
    button.textContent = button.classList.contains('wide-add') || button.closest('.signature-item')
      ? 'Adicionar ao pedido'
      : 'Adicionar';
  }, 1100);

  saveCart();
  updateCartUi();
  showToast(`${button.dataset.name} adicionado`);
}

function openCart() {
  lastFocusedElement = document.activeElement;
  backdrop.hidden = false;
  window.requestAnimationFrame(() => backdrop.classList.add('is-visible'));
  cartPanel.classList.add('is-open');
  cartPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  cartPanel.querySelector('.icon-button').focus();
}

function closeCart({ restoreFocus = true } = {}) {
  cartPanel.classList.remove('is-open');
  cartPanel.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('is-visible');
  window.setTimeout(() => {
    if (!cartPanel.classList.contains('is-open')) backdrop.hidden = true;
  }, 250);
  if (checkoutModal.hidden) document.body.classList.remove('modal-open');
  if (restoreFocus && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function openCheckout() {
  if (!cart.length) return;
  closeCart({ restoreFocus: false });
  checkoutFormView.hidden = false;
  checkoutSuccess.hidden = true;
  checkoutModal.hidden = false;
  checkoutModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  checkoutModal.querySelector('input').focus();
}

function closeCheckout() {
  checkoutModal.hidden = true;
  checkoutModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  siteNav?.classList.toggle('is-open', !isOpen);
  menuToggle.querySelector('.sr-only').textContent = isOpen ? 'Abrir menu' : 'Fechar menu';
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
  });
});

document.querySelectorAll('.add-item').forEach((button) => {
  button.addEventListener('click', () => addToCart(button));
});

document.querySelectorAll('.cart-open').forEach((button) => button.addEventListener('click', openCart));

document.querySelectorAll('[data-close-cart]').forEach((button) => {
  button.addEventListener('click', () => {
    closeCart();
    if (button.classList.contains('secondary-action')) {
      document.querySelector('#sabores').scrollIntoView({ behavior: 'smooth' });
    }
  });
});

cartItemsElement.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const item = cart.find((entry) => entry.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === 'increase') item.quantity += 1;
  if (button.dataset.action === 'decrease') item.quantity -= 1;
  if (button.dataset.action === 'remove' || item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== item.id);
  }

  saveCart();
  updateCartUi();
});

document.querySelector('[data-open-checkout]').addEventListener('click', openCheckout);
document.querySelector('[data-close-checkout]').addEventListener('click', closeCheckout);
checkoutModal.addEventListener('click', (event) => {
  if (event.target === checkoutModal) closeCheckout();
});

checkoutForm.querySelectorAll('input[name="delivery"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    const isDelivery = checkoutForm.elements.delivery.value === 'Entrega';
    const addressFields = checkoutForm.querySelector('.address-fields');
    addressFields.hidden = !isDelivery;
    checkoutForm.elements.address.required = isDelivery;
  });
});

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!checkoutForm.reportValidity() || !cart.length) return;

  document.querySelector('.order-number').textContent = `#ML${String(Date.now()).slice(-6)}`;
  checkoutFormView.hidden = true;
  checkoutSuccess.hidden = false;
  cart = [];
  saveCart();
  updateCartUi();
  checkoutSuccess.querySelector('button').focus();
});

document.querySelector('[data-new-order]').addEventListener('click', () => {
  checkoutForm.reset();
  checkoutForm.querySelector('.address-fields').hidden = false;
  checkoutForm.elements.address.required = true;
  closeCheckout();
  document.querySelector('#sabores').scrollIntoView({ behavior: 'smooth' });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!checkoutModal.hidden) closeCheckout();
  else if (cartPanel.classList.contains('is-open')) closeCart();
});

const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.menu-category-card');

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selected = filter.dataset.filter;
    filters.forEach((item) => {
      const active = item === filter;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    cards.forEach((card) => {
      card.hidden = selected !== 'todos' && card.dataset.category !== selected;
    });
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

document.querySelector('#year').textContent = new Date().getFullYear();
updateCartUi();
