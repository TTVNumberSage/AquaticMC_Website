# AquaticMC Website

Basic AquaticMC website based on the supplied YAMCS layout.

## Removed
- Database / D1
- Hyperdrive / LiteBans
- Sign in / account system
- Discord authentication
- Settings
- Forums
- Live chat
- Staff panel
- Admin panel
- Punishment lookup
- Minecraft linking
- Password reset
- Watchdog integrations
- Discord bots/services

## Included
- Home page
- AquaticMC branding/logo
- Lifesteal as the only advertised gamemode
- Server connection information
- Rules
- Static Vote page placeholder
- Static Staff page placeholder
- Discord buttons
- Tebex Store + local cart
- Tebex checkout

## Server information
- IP: `playaquaticmc.net`
- Bedrock port: `19132`
- Recommended/native version: `1.21.11`
- Bedrock supported
- Cracked supported
- Discord: `https://discord.gg/qduuwXuEnM`

## Tebex
The store is the only part that needs an external service. Set the Worker environment variable:

`TEBEX_WEBSTORE_TOKEN`

The website itself does not store user accounts, carts, staff data, or any database records. The cart is only kept locally in the visitor's browser until checkout.

Set `PUBLIC_URL` to `https://playaquaticmc.net` in the Worker environment/config if the domain differs.
