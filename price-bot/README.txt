📈 Alltra Price Bot

A Discord bot that provides real-time Alltra ecosystem token prices in USD and AUD, along with conversion tools, token listings, and quick access to on-chain statistics.

This bot automatically updates its Discord status and nickname with the latest ALL token price, supports multiple tokens, and includes a /convert command with AUD/ USD pricing.

🚀 Features
✅ Live Price Tracking

Fetches prices for all Alltra ecosystem tokens:

ALL

WALL

11::11

USDC / AUSDC

USDT

AUSDT

AUDA (MOOLA)

HYBX

HYDX

CHT (ChatCoin)

✅ Automatic Status & Nickname Updates

The bot updates its:

Discord presence (status message)

Nickname in every server it’s in
Every 5 minutes using the latest ALL token price.

✅ Slash Commands
Command	Description
/priceall	Shows ALL token price (USD & AUD)
/pricewall	Shows Wrapped Alltra price
/price1111	Shows 11::11 price
/priceusdc	Shows AUSDC price
/priceusdt	Shows USDT price
/priceausdt	Shows AUSDT price
/priceauda	Shows AUDA / MOOLA price
/pricehybx	Shows HYBX price
/pricehydx	Shows HYDX price
/pricecht	Shows CHT (ChatCoin) price
/listcoins	List all supported coins + their commands
/convert symbol:<TOKEN> amount:<AMOUNT>	Convert any token to USD & AUD
/commands	Full help menu
/stats	Shows link & preview to Alltra blockchain statistics
📡 Price API

Prices are fetched from:

ALL_PRICE_URL=https://alltra.azurewebsites.net/api/alltra-pricing?base=USD
ALL_PRICE_URL_AUD=https://alltra.azurewebsites.net/api/alltra-pricing?base=AUD

🛠 Installation (Local or EC2)
1. Clone the repository
git clone https://github.com/YOURNAME/alltra-price-bot.git
cd alltra-price-bot

2. Install dependencies
npm install

3. Create .env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_server_id

ALL_PRICE_URL=https://alltra.azurewebsites.net/api/alltra-pricing?base=USD
ALL_PRICE_URL_AUD=https://alltra.azurewebsites.net/api/alltra-pricing?base=AUD

▶ Running Locally
node index.js

🔁 Deployment (EC2 + PM2)

Start the bot:

pm2 start index.js --name all-price-bot
pm2 save


Check logs:

pm2 logs all-price-bot

🚀 One-Command Updates (deploy.sh)

A deploy.sh script is included to streamline updates:

./deploy.sh


This will:

Pull latest code from GitHub

Install new dependencies if needed

Restart PM2

Show status

📊 Alltra Network Stats

The bot includes a /stats command that links to:

🔗 https://alltra.global/stats

This displays blockchain analytics including:

Active users

Avg block time

Transactions

Contracts

Network activity trends

🧩 Custom Token Emojis

Custom Discord emojis are mapped inside the bot:

const TOKEN_EMOJIS = {
  ALL: "<:Alltra:emoji_id>",
  WALL: "<:Alltra:emoji_id>",
  HYBX: "<:HYBX:emoji_id>",
  ...
};


Replace emoji_id with your server’s real emoji IDs.

📦 File Structure
all-price-bot/
│── index.js
│── deploy-commands.js
│── package.json
│── package-lock.json
│── .env   (not tracked in Git)
│── deploy.sh
│── node_modules/

🤝 Contributions

Pull requests are welcome!
Feel free to contribute:

New tokens

Command improvements

API optimizations

Slash command expansions

📜 License

This project is licensed under MIT — free to use, modify, and distribute.