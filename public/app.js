const cfg = window.AQUATICMC_CONFIG;
const $ = (id) => document.getElementById(id);
const pages = [...document.querySelectorAll(".page")];
let storeData = [];
let selectedPackage = null;
let cart = JSON.parse(localStorage.getItem("aquaticmcCart") || "[]");

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

function money(v, currency="USD") {
  const n = Number(v || 0);
  try { return new Intl.NumberFormat("en-US", {style:"currency", currency}).format(n); }
  catch { return `${n.toFixed(2)} ${currency}`; }
}

function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.classList.add("hidden"), 1800);
}

function saveCart() {
  localStorage.setItem("aquaticmcCart", JSON.stringify(cart));
  renderCart();
}

function cartCount() {
  return cart.reduce((n, item) => n + Math.max(1, Number(item.quantity || 1)), 0);
}

function renderCart() {
  $("cartCount").textContent = cartCount();
  const box = $("cartItems");
  if (!cart.length) {
    box.innerHTML = `<div class="empty-state"><div class="big-icon">🛒</div><h3>Your cart is empty</h3><p>Add a package from the store to get started.</p></div>`;
  } else {
    box.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div>
          <strong>${esc(item.name)}</strong>
          <span>${money(item.price, item.currency)} each</span>
        </div>
        <div class="cart-controls">
          <input type="number" min="1" max="99" value="${Math.max(1, Number(item.quantity||1))}" data-qty="${i}">
          <button data-remove="${i}" aria-label="Remove ${esc(item.name)}">×</button>
        </div>
      </div>
    `).join("");
  }
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0);
  const currency = cart[0]?.currency || "USD";
  $("cartTotal").textContent = money(total, currency);
}

function addToCart(pkg, quantity=1) {
  const q = Math.max(1, Math.min(99, Number(quantity) || 1));
  const existing = cart.find(x => String(x.id) === String(pkg.id));
  if (existing) existing.quantity = Math.min(99, Number(existing.quantity || 1) + q);
  else cart.push({
    id: pkg.id, name: pkg.name, price: Number(pkg.price || 0),
    currency: pkg.currency || "USD", quantity: q,
    disableQuantity: !!pkg.disableQuantity, subscription: !!pkg.isSubscription
  });
  saveCart();
  showToast(`${pkg.name} added to cart`);
}

function openCart() {
  $("cartDrawer").classList.remove("hidden");
  $("cartDrawer").setAttribute("aria-hidden", "false");
  renderCart();
}
function closeCart() {
  $("cartDrawer").classList.add("hidden");
  $("cartDrawer").setAttribute("aria-hidden", "true");
}

function openDetails(pkg) {
  selectedPackage = pkg;
  $("detailKicker").textContent = `${cfg.gamemode} · Store Package`;
  $("detailTitle").textContent = pkg.name;
  $("detailPrice").textContent = `${money(pkg.price, pkg.currency || "USD")}${pkg.isSubscription ? ` · Every ${pkg.expiryLength || 1} ${pkg.expiryPeriod || "month"}${Number(pkg.expiryLength || 1) === 1 ? "" : "s"}` : ""}`;
  $("detailDescription").innerHTML = cleanDescription(pkg.description || "No additional description provided.");
  const q = $("detailQuantity");
  q.value = "1";
  q.disabled = !!pkg.disableQuantity || !!pkg.isSubscription;
  q.classList.toggle("hidden", !!pkg.disableQuantity || !!pkg.isSubscription);
  $("packageModal").classList.remove("hidden");
  $("packageModal").setAttribute("aria-hidden", "false");
}
function closeDetails() {
  $("packageModal").classList.add("hidden");
  $("packageModal").setAttribute("aria-hidden", "true");
  selectedPackage = null;
}

function cleanDescription(value) {
  const doc = new DOMParser().parseFromString(`<div>${String(value)}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  const allowed = new Set(["DIV","P","BR","STRONG","B","EM","I","U","S","UL","OL","LI","BLOCKQUOTE","H2","H3","H4","A","CODE","PRE","HR","SPAN"]);
  const walk = (node) => [...node.children].forEach(el => {
    if (!allowed.has(el.tagName)) {
      const frag = document.createDocumentFragment();
      while (el.firstChild) frag.appendChild(el.firstChild);
      el.replaceWith(frag);
      return walk(node);
    }
    [...el.attributes].forEach(attr => {
      if (el.tagName === "A" && attr.name.toLowerCase() === "href") {
        if (!/^https?:\/\//i.test(attr.value)) el.removeAttribute(attr.name);
      } else if (!(el.tagName === "A" && ["href","target","rel"].includes(attr.name.toLowerCase()))) {
        el.removeAttribute(attr.name);
      }
    });
    if (el.tagName === "A") { el.target = "_blank"; el.rel = "noopener noreferrer"; }
    walk(el);
  });
  walk(root);
  return root.innerHTML || `<p>${esc(value)}</p>`;
}

function renderStore() {
  const browser = $("storeBrowser");
  if (!storeData.length) {
    browser.innerHTML = `<div class="empty-card"><div class="big-icon">🛒</div><h2>Store is empty</h2><p>No Tebex packages are currently available.</p></div>`;
    return;
  }

  const categories = storeData;
  browser.innerHTML = `
    <div class="store-section-heading">
      <div><div class="eyebrow">${esc(cfg.gamemode)}</div><h2>What would you like to purchase?</h2><p>Choose a category to browse available packages.</p></div>
      <div class="store-count">${categories.reduce((n,c)=>n+c.packages.length,0)} packages</div>
    </div>
    <div class="category-grid">
      ${categories.map((c, i) => `
        <button class="category-card" data-category="${i}">
          <div class="category-icon">${categoryIcon(c.name)}</div>
          <div><h3>${esc(c.name)}</h3><p>${esc(c.description || "Browse packages in this category.")}</p><strong>${c.packages.length} ${c.packages.length === 1 ? "package" : "packages"} →</strong></div>
        </button>`).join("")}
    </div>`;
}

function renderCategory(index) {
  const category = storeData[index];
  if (!category) return renderStore();
  $("storeBrowser").innerHTML = `
    <button class="store-back" id="storeBack">← All categories</button>
    <div class="store-section-heading category-heading">
      <div><div class="eyebrow">${esc(cfg.gamemode)} · ${esc(category.name)}</div><h2>${esc(category.name)}</h2><p>${esc(category.description || "Choose a package below.")}</p></div>
      <div class="store-count">${category.packages.length} packages</div>
    </div>
    <div class="package-grid">
      ${category.packages.map((p, i) => `
        <article class="package-card" data-package="${index}:${i}">
          <div class="package-icon">${p.image ? `<img src="${esc(p.image)}" alt="">` : categoryIcon(category.name)}</div>
          <div class="package-content">
            <div class="package-game">${esc(cfg.gamemode)} · ${esc(category.name)}</div>
            <h3>${esc(p.name)}</h3>
            <p class="package-teaser">Click for package details.</p>
            <div class="package-bottom"><strong>${money(p.price,p.currency)}${p.isSubscription ? `<small> / ${esc(p.expiryLength || 1)} ${esc(p.expiryPeriod || "month")}</small>` : ""}</strong><button class="primary small" data-add="${index}:${i}">${p.isSubscription ? "Subscribe" : "Add to Cart"}</button></div>
          </div>
        </article>`).join("")}
    </div>`;
}

function categoryIcon(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("rank")) return "🏆";
  if (n.includes("key")) return "🗝️";
  if (n.includes("crate")) return "🎁";
  if (n.includes("gem") || n.includes("coin")) return "💎";
  if (n.includes("kit")) return "🧰";
  if (n.includes("bundle")) return "📦";
  return "🛒";
}

async function loadStore() {
  try {
    const r = await fetch("/api/store");
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Unable to load the store.");
    storeData = Array.isArray(data.groups) ? data.groups : [];
    renderStore();
  } catch (err) {
    $("storeStatus").classList.remove("hidden");
    $("storeStatus").innerHTML = `<strong>Store unavailable</strong><span>${esc(err.message)}</span>`;
    $("storeBrowser").innerHTML = `<div class="empty-card"><div class="big-icon">⚠️</div><h2>We couldn't load the store</h2><p>${esc(err.message)}</p></div>`;
  }
}

async function checkout() {
  const recipient = $("recipient").value.trim();
  const creatorCode = $("creatorCode").value.trim();
  const status = $("checkoutStatus");
  if (!/^[A-Za-z0-9_]{3,16}$/.test(recipient)) {
    status.textContent = "Enter a valid Minecraft username (3–16 characters).";
    return;
  }
  if (!cart.length) {
    status.textContent = "Your cart is empty.";
    return;
  }
  status.textContent = "Creating your secure Tebex checkout…";
  $("checkoutBtn").disabled = true;
  try {
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({recipientMinecraft: recipient, creatorCode, items: cart.map(x => ({packageId:x.id, quantity:x.quantity}))})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Unable to create checkout.");
    if (!data.checkoutUrl) throw new Error("Tebex did not return a checkout link.");
    window.location.href = data.checkoutUrl;
  } catch (err) {
    status.textContent = err.message;
    $("checkoutBtn").disabled = false;
  }
}

function showPage(id) {
  const valid = pages.some(p => p.id === id) ? id : "home";
  pages.forEach(p => p.classList.toggle("active", p.id === valid));
  document.querySelectorAll("[data-page]").forEach(a => a.classList.toggle("active", a.dataset.page === valid));
  window.scrollTo({top:0, behavior:"smooth"});
  if (valid === "store" && !storeData.length) loadStore();
}

document.addEventListener("click", e => {
  const nav = e.target.closest("[data-page]");
  if (nav) return;

  const copy = e.target.closest("[data-copy]");
  if (copy) {
    navigator.clipboard?.writeText(copy.dataset.copy).then(() => showToast("IP copied to clipboard")).catch(() => showToast(`Copy: ${copy.dataset.copy}`));
    return;
  }

  const cat = e.target.closest("[data-category]");
  if (cat) { renderCategory(Number(cat.dataset.category)); return; }

  const back = e.target.closest("#storeBack");
  if (back) { renderStore(); return; }

  const add = e.target.closest("[data-add]");
  if (add) {
    const [ci, pi] = add.dataset.add.split(":").map(Number);
    const pkg = storeData[ci]?.packages?.[pi];
    if (pkg) addToCart(pkg, pkg.isSubscription || pkg.disableQuantity ? 1 : 1);
    return;
  }

  const card = e.target.closest("[data-package]");
  if (card && !e.target.closest("button")) {
    const [ci, pi] = card.dataset.package.split(":").map(Number);
    const pkg = storeData[ci]?.packages?.[pi];
    if (pkg) openDetails(pkg);
    return;
  }

  if (e.target.closest("[data-close-modal]")) closeDetails();
  if (e.target.closest("[data-close-cart]")) closeCart();
});

document.querySelectorAll("[data-page]").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  const id = a.dataset.page;
  history.pushState(null, "", `#${id}`);
  showPage(id);
}));

window.addEventListener("popstate", () => showPage(location.hash.slice(1) || "home"));
window.addEventListener("hashchange", () => showPage(location.hash.slice(1) || "home"));

$("openCart").addEventListener("click", openCart);
$("checkoutBtn").addEventListener("click", checkout);
$("detailAdd").addEventListener("click", () => {
  if (!selectedPackage) return;
  addToCart(selectedPackage, selectedPackage.isSubscription || selectedPackage.disableQuantity ? 1 : Number($("detailQuantity").value || 1));
  closeDetails();
  openCart();
});

$("cartItems").addEventListener("click", e => {
  const remove = e.target.closest("[data-remove]");
  if (remove) { cart.splice(Number(remove.dataset.remove), 1); saveCart(); }
});
$("cartItems").addEventListener("input", e => {
  const q = e.target.closest("[data-qty]");
  if (!q) return;
  const item = cart[Number(q.dataset.qty)];
  if (item) item.quantity = Math.max(1, Math.min(99, Number(q.value) || 1));
  saveCart();
});

document.querySelectorAll("a[href^='https://discord.gg']").forEach(a => a.href = cfg.discordUrl);

showPage(location.hash.slice(1) || "home");
renderCart();
loadStore();
