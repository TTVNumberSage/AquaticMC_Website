# AquaticMC Website

A static, responsive AquaticMC Minecraft server website.

## Files

- `index.html` — site structure/content
- `styles.css` — complete responsive design
- `script.js` — staff data, voting data, copy-IP button, placeholder Tebex integration
- `assets/aquaticmc.png` — supplied AquaticMC logo

## Easy configuration

Open `script.js` and edit:

### Tebex
```js
const TEBEX_STORE_URL = "";
```
Replace the empty string with your real Tebex storefront URL.

### Voting sites
Edit the `voteSites` array and set each site's `url`.

### Staff
Edit the `staff` array to add/remove usernames while keeping the hierarchy.

### Server IP / Discord
The current values are already configured:
- `play.playaquaticmc.xyz`
- `https://discord.gg/ntz2NSUmTn`

## Hosting

This is a static website and can be hosted directly on GitHub Pages, Render Static Sites, Cloudflare Pages, Netlify, or similar services.

No build command is required.
