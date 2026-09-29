# AquaticMC Basic Website

A simplified, static-first AquaticMC website with a small server-side Tebex proxy for the store.

## Server information
- Java IP: `playaquaticmc.net`
- Bedrock IP: `playaquaticmc.net`
- Bedrock port: `19132`
- Recommended/native version: `1.21.11`
- Bedrock supported
- Cracked supported
- Gamemode: Lifesteal
- Discord: https://discord.gg/qduuwXuEnM

## Tebex
The store is configured to load only these categories, in this order:
1. Gems
2. Ranks
3. Rank Upgrades
4. Keys
5. Collectors
6. GKits

The Tebex token is configured server-side in `wrangler.toml` for convenience. For a public Git repository, move `TEBEX_WEBSTORE_TOKEN` to a Cloudflare Worker secret instead of committing the token.

Deploy with:

```bash
npm install
npx wrangler deploy
```

If the token is moved to a secret, use:

```bash
npx wrangler secret put TEBEX_WEBSTORE_TOKEN
```

The site does not contain a database, account system, staff/admin panel, Discord bot integration, punishment integration, or sign-in system.
