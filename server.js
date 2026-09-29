import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import express from "express";

const app = express();
const PORT = 3000;
const TEBEX_API = "https://headless.tebex.io/api";

app.use(express.json({limit:"2mb"}));

function tebexToken() {
  return String(env.TEBEX_WEBSTORE_TOKEN || env.TEBEX_PUBLIC_TOKEN || "").trim();
}

function cleanDescription(value="") {
  return String(value || "")
    .replace(/<\/?p\b[^>]*>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ").trim();
}

function normalizePackage(p, categoryName="") {
  let period = p.expiry_period || null;
  if (period && typeof period === "object") {
    period = period.unit ?? period.interval ?? period.period ?? period.name ?? period.value ?? null;
  }
  return {
    id: p.id,
    name: p.name,
    description: String(p.description || ""),
    price: Number(p.total_price ?? p.base_price ?? 0),
    currency: p.currency || "USD",
    image: p.image || null,
    type: p.type || "single",
    isSubscription: String(p.type || "single").toLowerCase() === "subscription",
    expiryPeriod: period == null ? null : String(period),
    expiryLength: Number(p.expiry_length || 0) || null,
    disableQuantity: !!p.disable_quantity,
    category: categoryName || String(p.category?.name || "").trim()
  };
}

function parentId(c) {
  return c?.parent?.id != null ? String(c.parent.id) : null;
}
function parentName(c) {
  return String(c?.parent?.name || "").trim();
}

function buildTree(categories) {
  const byId = new Map(categories.map(c => [String(c.id), c]));
  const roots = new Map();

  function rootFor(category) {
    let current = category;
    const seen = new Set();
    while (current && parentId(current)) {
      const id = String(current.id);
      if (seen.has(id)) break;
      seen.add(id);
      const parent = byId.get(parentId(current));
      if (!parent) {
        current = {id: parentId(current), name: parentName(current), parent: {}, packages: [], order: 0};
        break;
      }
      current = parent;
    }
    return current || category;
  }

  for (const c of categories) {
    const root = rootFor(c);
    const rootName = String(root.name || "").trim();
    if (!rootName) continue;
    const key = rootName.toLowerCase();

    if (!roots.has(key)) {
      roots.set(key, {id:String(root.id), name:rootName, order:Number(root.order || 0), categories:[]});
    }

    const group = roots.get(key);
    const isRoot = String(c.id) === String(root.id);
    if (!isRoot) {
      group.categories.push({
        id:String(c.id),
        name:String(c.name || "").trim(),
        description:cleanDescription(c.description),
        order:Number(c.order || 0),
        packages:Array.isArray(c.packages) ? c.packages.map(p => normalizePackage(p, c.name)) : []
      });
    } else if (Array.isArray(c.packages) && c.packages.length) {
      group.categories.push({
        id:String(c.id), name:"General",
        description:"Packages available in this store section.",
        order:-1,
        packages:c.packages.map(p => normalizePackage(p, c.name))
      });
    }
  }

  return [...roots.values()]
    .map(g => ({...g, categories:g.categories.sort((a,b)=>(a.order-b.order)||a.name.localeCompare(b.name))}))
    .sort((a,b)=>(a.order-b.order)||a.name.localeCompare(b.name));
}

async function tebexRequest(url, options={}) {
  const r = await fetch(url, {
    ...options,
    headers: {Accept:"application/json", "Content-Type":"application/json", ...(options.headers || {})}
  });
  let data = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) {
    const message = data?.detail || data?.error || data?.message || `Tebex request failed (${r.status})`;
    const err = new Error(String(message));
    err.status = r.status;
    throw err;
  }
  return data;
}

async function getCategories() {
  const token = tebexToken();
  if (!token) throw Object.assign(new Error("Tebex is not configured. Add TEBEX_WEBSTORE_TOKEN to the Worker environment."), {status:503});
  const data = await tebexRequest(`${TEBEX_API}/accounts/${encodeURIComponent(token)}/categories?includePackages=1`);
  return Array.isArray(data?.data) ? data.data : [];
}

const STORE_CATEGORIES = ["Gems", "Ranks", "Rank Upgrades", "Keys", "Collectors", "Gkits"];

function selectStoreCategories(tree) {
  const wanted = new Map(STORE_CATEGORIES.map((name, index) => [name.toLowerCase(), {name, index}]));
  const selected = [];

  for (const group of tree) {
    for (const category of group.categories || []) {
      const key = String(category.name || "").trim().toLowerCase();
      const match = wanted.get(key);
      if (!match) continue;
      selected.push({...category, name: match.name, _storeIndex: match.index});
    }
  }

  return selected.sort((a, b) => a._storeIndex - b._storeIndex).map(({_storeIndex, ...category}) => category);
}

app.get("/api/store", async (_req, res) => {
  try {
    const tree = buildTree(await getCategories());
    res.json({
      configured: Boolean(tebexToken()),
      gamemode: "Lifesteal",
      groups: selectStoreCategories(tree),
      requestedCategories: STORE_CATEGORIES
    });
  } catch (e) {
    console.error("AquaticMC Tebex store error:", e);
    res.status(e.status || 500).json({error:e.message || "Unable to load the Tebex store."});
  }
});

app.post("/api/checkout", async (req, res) => {
  const token = tebexToken();
  if (!token) return res.status(503).json({error:"Tebex is not configured."});

  const recipient = String(req.body?.recipientMinecraft || "").trim();
  const creatorCode = String(req.body?.creatorCode || "").trim();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  if (!/^[A-Za-z0-9_]{3,16}$/.test(recipient)) {
    return res.status(400).json({error:"Enter a valid Minecraft username (3–16 letters, numbers, or underscores)."});
  }
  if (!items.length) return res.status(400).json({error:"Cart is empty."});

  try {
    const packagesResponse = await tebexRequest(`${TEBEX_API}/accounts/${encodeURIComponent(token)}/packages`);
    const packages = Array.isArray(packagesResponse?.data) ? packagesResponse.data : [];
    const available = new Map(packages.map(p => [String(p.id), p]));

    const clean = [];
    let hasSubscription = false;
    let hasOneTime = false;

    for (const item of items) {
      const p = available.get(String(item.packageId));
      if (!p) return res.status(400).json({error:`Package ${item.packageId || "unknown"} is not available.`});
      const subscription = String(p.type || "single").toLowerCase() === "subscription";
      hasSubscription ||= subscription;
      hasOneTime ||= !subscription;
      clean.push({
        package_id: p.id,
        quantity: subscription ? 1 : Math.max(1, Math.min(99, Number(item.quantity || 1)))
      });
    }

    if (hasSubscription && hasOneTime) return res.status(400).json({error:"Subscriptions must be purchased separately from one-time items."});
    if (hasSubscription && clean.length > 1) return res.status(400).json({error:"Only one subscription can be purchased at a time."});

    const base = publicBaseUrl(req);
    const basket = await tebexRequest(`${TEBEX_API}/accounts/${encodeURIComponent(token)}/baskets`, {
      method:"POST",
      body:JSON.stringify({
        username: recipient,
        complete_url:`${base}/?tebex_complete=1`,
        cancel_url:`${base}/?tebex_cancelled=1`,
        complete_auto_redirect:false,
        custom:{minecraftRecipient:recipient}
      })
    });

    const data = basket?.data || basket;
    const ident = data?.ident;
    if (!ident) throw new Error("Tebex did not return a basket identifier.");

    for (const item of clean) {
      await tebexRequest(`${TEBEX_API}/baskets/${encodeURIComponent(ident)}/packages`, {
        method:"POST", body:JSON.stringify(item)
      });
    }

    if (creatorCode) {
      await tebexRequest(`${TEBEX_API}/accounts/${encodeURIComponent(token)}/baskets/${encodeURIComponent(ident)}/creator-codes`, {
        method:"POST", body:JSON.stringify({creator_code:creatorCode})
      });
    }

    const finalBasket = await tebexRequest(`${TEBEX_API}/accounts/${encodeURIComponent(token)}/baskets/${encodeURIComponent(ident)}`);
    const finalData = finalBasket?.data || finalBasket;
    const checkoutUrl = finalData?.links?.checkout;

    if (!checkoutUrl) throw new Error("Tebex did not return a checkout link.");
    res.json({checkoutUrl});
  } catch (e) {
    console.error("AquaticMC Tebex checkout error:", e);
    res.status(e.status || 500).json({error:e.message || "Unable to create Tebex checkout."});
  }
});

function publicBaseUrl(req) {
  let base = String(env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`).trim();
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/$/, "");
}

app.use((err,_req,res,_next) => {
  console.error(err);
  res.status(500).json({error:"Internal server error."});
});

app.listen(PORT);
export default httpServerHandler({port:PORT});
