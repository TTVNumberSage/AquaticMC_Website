# AquaticMC Website

A static, responsive AquaticMC Minecraft server website served through a minimal Node.js/npm server.

## Files

- `index.html` — site structure/content
- `styles.css` — complete responsive design
- `script.js` — staff data, voting data, copy-IP button, placeholder Tebex integration
- `server.js` — lightweight Node.js web server
- `package.json` — npm configuration and start script
- `assets/aquaticmc.png` — supplied AquaticMC logo

## Render Web Service settings

If using Render as a **Web Service**, use:

**Build Command**
```text
npm install
```

**Start Command**
```text
npm start
```

Render will provide the `PORT` environment variable automatically, and `server.js` listens on it.

No Express or other npm dependency is required.

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
