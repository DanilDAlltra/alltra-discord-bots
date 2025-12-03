# 💰 Alltra Price Bot

> Real-time cryptocurrency price tracking for the Alltra ecosystem with automated status updates and conversion tools.

A powerful Discord bot that provides instant access to Alltra ecosystem token prices in both USD and AUD, featuring automatic status updates, comprehensive conversion tools, and blockchain statistics integration.

## 🌟 Key Features

### 📊 Real-Time Price Tracking
- **10+ Alltra Ecosystem Tokens**: ALL, WALL, 11::11, USDC/AUSDC, USDT/AUSDT, AUDA (MOOLA), HYBX, HYDX, CHT (ChatCoin)
- **Dual Currency Support**: All prices displayed in both USD and AUD
- **High Precision**: 6-decimal precision for accurate pricing
- **Reliable API**: Fetches from official Alltra pricing endpoints

### 🤖 Automated Updates
- **Live Status**: Bot presence updates every 5 minutes with current ALL price
- **Server Nicknames**: Automatically updates nickname across all servers
- **Always Current**: Continuous background price monitoring

### ⚡ Slash Commands
| Command | Description |
|---------|-------------|
| `/priceall` | Shows ALL token price (USD & AUD) |
| `/pricewall` | Shows Wrapped Alltra price |
| `/price1111` | Shows 11::11 price |
| `/priceusdc` | Shows AUSDC price |
| `/priceusdt` | Shows USDT price |
| `/priceausdt` | Shows AUSDT price |
| `/priceauda` | Shows AUDA / MOOLA price |
| `/pricehybx` | Shows HYBX price |
| `/pricehydx` | Shows HYDX price |
| `/pricecht` | Shows CHT (ChatCoin) price |
| `/listcoins` | List all supported tokens and commands |
| `/convert` | Convert token amounts to USD & AUD |
| `/commands` | Full help menu with usage examples |
| `/stats` | Link to Alltra blockchain statistics dashboard |

### 🔗 Blockchain Integration
- **Network Stats**: Direct access to Alltra blockchain analytics
- **Live Dashboard**: Links to comprehensive network statistics
- **Activity Metrics**: Block times, transactions, contracts, and user data
## 📋 Prerequisites

Before setting up the bot, ensure you have:

- **Node.js**: Version 16.6.0 or higher
- **npm**: Package manager (comes with Node.js)
- **Discord Account**: With permissions to create/manage bots
- **Discord Server**: Where you'll deploy the bot
- **Git**: For cloning the repository (optional for direct download)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOURNAME/alltra-price-bot.git
cd alltra-price-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id
GUILD_ID=your_server_id

# Alltra Price API Endpoints
ALL_PRICE_URL=https://alltra.azurewebsites.net/api/alltra-pricing?base=USD
ALL_PRICE_URL_AUD=https://alltra.azurewebsites.net/api/alltra-pricing?base=AUD
```

## ⚙️ Discord Bot Setup

### Creating a Discord Bot

1. **Go to Discord Developer Portal**
   - Visit: https://discord.com/developers/applications
   - Click "New Application"
   - Give it a name (e.g., "Alltra Price Bot")

2. **Get Bot Token**
   - Navigate to "Bot" section
   - Under "Token", click "Reset Token" or "Copy"
   - **Important**: Keep this token secret!

3. **Get Application ID**
   - In "General Information", copy the "Application ID"
   - This becomes your `CLIENT_ID`

4. **Invite Bot to Server**
   - Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Use Slash Commands`, `Change Nickname`
   - Copy and use the generated URL to invite the bot

### Required Bot Permissions

The bot needs these minimum permissions in your server:
- ✅ **Send Messages**
- ✅ **Use Slash Commands**
- ✅ **Read Message History**
- ✅ **Change Nickname** (for status updates)

### Deploying Slash Commands

After setting up your `.env` file:

```bash
node deploy-commands.js
```

This registers all slash commands with your Discord server.

## 🖥️ Running the Bot

### Local Development
```bash
node index.js
```

### Production Deployment (EC2 + PM2)

1. **Install PM2 globally:**
```bash
npm install -g pm2
```

2. **Start the bot:**
```bash
pm2 start index.js --name alltra-price-bot
pm2 save
```

3. **Check status:**
```bash
pm2 status
pm2 logs alltra-price-bot
```

4. **Restart/Update:**
```bash
pm2 restart alltra-price-bot
```

### Automated Deployment Script

A `deploy.sh` script is included for easy updates:

```bash
./deploy.sh
```

This script will:
- Pull latest code from Git
- Install new dependencies
- Restart PM2 process
- Show deployment status

## 📊 Price API Integration

The bot fetches prices from official Alltra endpoints:

- **USD Prices**: `https://alltra.azurewebsites.net/api/alltra-pricing?base=USD`
- **AUD Prices**: `https://alltra.azurewebsites.net/api/alltra-pricing?base=AUD`

**Response Format:**
```json
{
  "rates": [
    {
      "symbol": "ALL",
      "perToken": "0.012345"
    }
  ]
}
```

## 📊 Alltra Network Statistics

The `/stats` command provides quick access to comprehensive blockchain analytics:

### Available Metrics
- **Network Activity**: Active users, daily new accounts
- **Performance**: Average block time, transaction throughput
- **Ecosystem**: Total accounts, addresses, contracts
- **Trends**: Network activity and growth patterns

### Live Dashboard
- **URL**: https://alltra.global/stats
- **Real-time Updates**: Continuous blockchain monitoring
- **Interactive Charts**: Visual representation of network health

## 🎨 Custom Token Emojis

The bot uses custom Discord emojis for visual appeal. Configure them in `index.js`:

```javascript
const TOKEN_EMOJIS = {
  ALL: "<:Alltra:1258966813010690119>",
  WALL: "<:Alltra:1258966813010690119>",
  "11::11": "<:1111:1258966750964351078>",
  USDC: "<:usdc:1442316389741494303>",
  USDT: "<:tetherusdt:1442316735519789207>",
  AUSDT: "<:ausdt:1442314194727862483>",
  AUDA: "<:auda:1442314143448305736>",
  HYBX: "<:HYBX:1258966076381728788>",
  HYDX: "<:HYDX:1258966864940372159>",
  CHT: "<:cht:1442314225455333467>",
};
```

### Setting Up Emojis

1. **Upload to Discord**: Go to Server Settings → Emoji
2. **Get Emoji ID**: Right-click emoji → Copy Link → Extract ID from URL
3. **Update Code**: Replace `emoji_id` with actual Discord emoji ID
4. **Restart Bot**: Apply changes

## 📁 Project Structure

```
alltra-price-bot/
├── index.js              # Main bot application
├── deploy-commands.js    # Slash command registration
├── package.json          # Dependencies and scripts
├── package-lock.json     # Lockfile for exact versions
├── .env                  # Environment variables (gitignored)
├── deploy.sh            # Deployment automation script
├── README.md            # This documentation
└── node_modules/        # Installed dependencies
```

## 💡 Usage Examples

### Basic Price Commands
```
/priceall     # Shows current ALL price
/pricehybx    # Shows HYBX price in USD/AUD
```

### Token Conversion
```
/convert symbol:ALL amount:100     # Convert 100 ALL to USD/AUD
/convert symbol:HYBX amount:50     # Convert 50 HYBX tokens
```

### Information Commands
```
/listcoins    # See all supported tokens
/commands     # Full command reference
/stats        # Blockchain statistics link
```

### Real-time Updates
The bot automatically updates its status every 5 minutes with the latest ALL price, so users can always see current market conditions at a glance.

## 🔧 Troubleshooting

### Bot Not Responding
- **Check Token**: Verify `DISCORD_TOKEN` is correct
- **Bot Online**: Ensure bot shows as online in your server
- **Permissions**: Confirm bot has "Use Slash Commands" permission
- **Commands Deployed**: Run `node deploy-commands.js` after config changes

### Price Fetching Errors
- **API Endpoints**: Verify `ALL_PRICE_URL` and `ALL_PRICE_URL_AUD` are accessible
- **Network Issues**: Check bot server internet connection
- **API Changes**: Alltra API may be temporarily down
- **Rate Limits**: Bot respects API rate limits automatically

### Status Updates Not Working
- **Manage Nickname**: Bot needs "Change Nickname" permission
- **Bot Role**: Ensure bot role is above roles it should manage
- **Rate Limits**: Discord limits nickname changes (10 per 10 minutes)

### Permission Errors
- **Server Owner**: Contact server admin for bot permissions
- **Bot Role Position**: Move bot role higher in role hierarchy
- **Scope Issues**: Re-invite bot with correct permissions

### Deployment Issues
- **PM2 Not Found**: Run `npm install -g pm2`
- **Port Conflicts**: Ensure no other services use the same resources
- **Memory Issues**: Monitor server resources on EC2

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- **New Tokens**: Add support for additional Alltra ecosystem tokens
- **Command Improvements**: Enhance existing commands or add new features
- **API Optimizations**: Improve price fetching reliability
- **UI/UX Enhancements**: Better formatting and user experience
- **Documentation**: Improve this README or add code comments

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Code Style
- Use consistent formatting and comments
- Test all commands before submitting
- Follow existing naming conventions
- Update documentation for any new features

## 📜 License

This project is licensed under the MIT License - see the license file for details. Feel free to use, modify, and distribute this bot according to the license terms.

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Discord**: Join our community for support
- **Documentation**: This README is your primary resource

---

*Built with ❤️ for the Alltra ecosystem*