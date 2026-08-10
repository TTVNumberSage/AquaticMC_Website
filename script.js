const SERVER_IP = "play.playaquaticmc.xyz";
const DISCORD_URL = "https://discord.gg/ntz2NSUmTn";

// Add your real Tebex storefront URL here when it is ready.
// Example: const TEBEX_STORE_URL = "https://yourstore.tebex.io/";
const TEBEX_STORE_URL = "";

const staff = [
  { rank: "Owner", members: ["Jackpot"] },
  { rank: "Network Manager", members: [] },
  { rank: "Manager", members: ["Mr_anyomase"] },
  { rank: "Developer", members: ["TTVNumberSage", "BlueXGamer"] },
  { rank: "Senior Admin", members: [] },
  { rank: "Admin", members: ["blez_1"] },
  { rank: "Senior Mod", members: [] },
  { rank: "Mod", members: ["KoKsi9", "Nafie"] },
  { rank: "Junior Mod", members: ["vicmiclik"] },
  { rank: "Helper", members: ["xtabbu"] },
  { rank: "Builder", members: [] }
];

const voteSites = [
  { name: "Example Minecraft Server List", description: "Placeholder voting website — replace with your real voting link.", reward: "Example reward", url: "" },
  { name: "Example Server List", description: "Placeholder voting website — replace with your real voting link.", reward: "Example reward", url: "" },
  { name: "Example Voting Website", description: "Placeholder voting website — replace with your real voting link.", reward: "Example reward", url: "" }
];

const staffTree = document.querySelector("#staffTree");
staff.forEach(level => {
  const levelEl = document.createElement("div");
  levelEl.className = "staff-level";

  const cards = level.members.length
    ? level.members.map(username => `
        <article class="staff-card">
          <img class="staff-head"
               src="https://mc-heads.net/avatar/${encodeURIComponent(username)}/128"
               alt="${username} Minecraft skin"
               loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling?.classList.add('fallback-head')">
          <div class="staff-name">${username}</div>
          <div class="staff-rank">${level.rank}</div>
        </article>
      `).join("")
    : `
      <article class="staff-card empty-card">
        <div class="staff-head">+</div>
        <div class="staff-name">Open Position</div>
        <div class="staff-rank">${level.rank}</div>
      </article>
    `;

  levelEl.innerHTML = `
    <div class="level-title">${level.rank.toUpperCase()}</div>
    <div class="staff-cards">${cards}</div>
  `;
  staffTree.appendChild(levelEl);
});

const voteGrid = document.querySelector("#voteGrid");
voteSites.forEach((site, index) => {
  const card = document.createElement("article");
  card.className = "vote-card";
  card.innerHTML = `
    <div class="vote-number">${String(index + 1).padStart(2, "0")}</div>
    <span class="vote-placeholder">PLACEHOLDER SITE</span>
    <h3>${site.name}</h3>
    <p>${site.description}</p>
    <small style="display:block;color:#6f8999;margin-bottom:15px">${site.reward}</small>
    <button class="button button-primary button-small vote-button">Vote Now</button>
  `;
  card.querySelector(".vote-button").addEventListener("click", () => {
    if (site.url) {
      window.open(site.url, "_blank", "noopener");
    } else {
      showToast("This is a placeholder. Add your voting URL in script.js.");
    }
  });
  voteGrid.appendChild(card);
});

const toast = document.querySelector("#toast");
let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function copyIP(button) {
  try {
    await navigator.clipboard.writeText(SERVER_IP);
    const original = button.textContent;
    button.textContent = "Copied!";
    showToast("IP Copied!");
    setTimeout(() => button.textContent = original, 1600);
  } catch {
    showToast(`Copy failed — server IP: ${SERVER_IP}`);
  }
}

document.querySelectorAll("[data-copy-ip]").forEach(button => {
  button.addEventListener("click", () => copyIP(button));
});

document.querySelectorAll("[data-placeholder-purchase]").forEach(button => {
  button.addEventListener("click", () => {
    if (TEBEX_STORE_URL) {
      window.open(TEBEX_STORE_URL, "_blank", "noopener");
    } else {
      showToast("Tebex isn't connected yet — add TEBEX_STORE_URL in script.js.");
    }
  });
});

document.querySelectorAll("[data-placeholder-link]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showToast("Placeholder link — replace it with your real page.");
  });
});

const mobileToggle = document.querySelector("#mobileToggle");
const mainNav = document.querySelector("#mainNav");
mobileToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  mobileToggle.setAttribute("aria-expanded", String(open));
});
mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    mobileToggle.setAttribute("aria-expanded", "false");
  });
});

const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
const sections = [...document.querySelectorAll("main section[id]")];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
    }
  });
}, { rootMargin: "-35% 0px -55% 0px" });
sections.forEach(section => observer.observe(section));
