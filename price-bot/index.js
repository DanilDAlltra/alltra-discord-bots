require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// 🔹 Custom token emojis – YOUR REAL EMOJI IDS
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

// Map command names to actual token symbols in the API
const PRICE_COMMAND_MAP = {
  priceall: "ALL",
  pricewall: "WALL",
  price1111: "11::11",
  priceusdc: "USDC",
  priceusdt: "USDT",
  priceausdt: "AUSDT",
  priceauda: "AUDA",
  pricehybx: "HYBX",
  pricehydx: "HYDX",
  pricecht: "CHT",
};

// Helper: extract perToken for a symbol from a given API response
function extractPriceFromResponse(res, symbol) {
  const data = res.data;
  if (!Array.isArray(data.rates)) {
    throw new Error("rates is not an array");
  }

  const entry = data.rates.find(
    (r) => r.symbol && r.symbol.toUpperCase() === symbol.toUpperCase()
  );
  if (!entry) {
    throw new Error(`Symbol ${symbol} not found`);
  }

  const price = Number(entry.perToken);
  if (isNaN(price)) throw new Error("perToken is not numeric");

  return price;
}

// Fetch BOTH USD and AUD prices for any symbol
async function fetchTokenPrices(symbol) {
  try {
    const [usdRes, audRes] = await Promise.all([
      axios.get(process.env.ALL_PRICE_URL),
      axios.get(process.env.ALL_PRICE_URL_AUD),
    ]);

    const usd = extractPriceFromResponse(usdRes, symbol);
    const aud = extractPriceFromResponse(audRes, symbol);

    return { usd, aud };
  } catch (err) {
    console.error(`Error fetching ${symbol} prices:`, err.message);
    return null;
  }
}

// Status update (uses ALL in USD for status/nickname)
async function updateStatusAndNick() {
  const prices = await fetchTokenPrices("ALL");
  if (!prices) return;

  const priceUsdStr = prices.usd.toFixed(6);

  try {
    client.user.setPresence({
      activities: [
        { name: `ALL: $${priceUsdStr} USD`, type: ActivityType.Watching },
      ],
      status: "online",
    });
  } catch (e) {
    console.error("Presence error:", e);
  }

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const me = guild.members.me || (await guild.members.fetchMe());
      if (!me.manageable) continue;
      await me.setNickname(`ALL: $${priceUsdStr} USD`);
    } catch {
      // missing permission in some servers is normal
    }
  }
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await updateStatusAndNick();
  setInterval(updateStatusAndNick, 300000); // 5 mins
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;

  // 0) /stats – link to Alltra stats dashboard
  if (name === "stats") {
    return interaction.reply(
      [
        "📊 **Alltra Network Statistics Dashboard**",
        "",
        "View real-time blockchain analytics including:",
        "• Average block time",
        "• Total accounts & addresses",
        "• Active accounts",
        "• Daily new accounts",
        "• Transactions, contracts & more",
        "",
        "🔗 **Live Dashboard:** https://alltra.global/stats",
      ].join("\n")
    );
  }

  // 1) /listcoins
  if (name === "listcoins") {
    const lines = Object.entries(PRICE_COMMAND_MAP).map(([cmd, symbol]) => {
      const emoji = TOKEN_EMOJIS[symbol] || "•";
      return `${emoji} \`/${cmd}\` → ${symbol}`;
    });

    return interaction.reply(
      [
        "📜 **Supported Alltra tokens & commands:**",
        "",
        ...lines,
        "",
        "You can also use `/convert` to convert a token amount to USD & AUD.",
      ].join("\n")
    );
  }

  // 2) /commands
  if (name === "commands") {
    return interaction.reply(
      [
        "🧾 **Alltraverse Coin Price BOT – Commands**",
        "",
        `${TOKEN_EMOJIS.ALL || "•"} \`/priceall\` – Show price of ALL`,
        `${TOKEN_EMOJIS.WALL || "•"} \`/pricewall\` – Show price of WALL (Wrapped Alltra)`,
        `${TOKEN_EMOJIS["11::11"] || "•"} \`/price1111\` – Show price of 11::11`,
        `${TOKEN_EMOJIS.USDC || "•"} \`/priceusdc\` – Show price of USDC (AUSDC)`,
        `${TOKEN_EMOJIS.USDT || "•"} \`/priceusdt\` – Show price of USDT`,
        `${TOKEN_EMOJIS.AUSDT || "•"} \`/priceausdt\` – Show price of AUSDT`,
        `${TOKEN_EMOJIS.AUDA || "•"} \`/priceauda\` – Show price of AUDA / MOOLA`,
        `${TOKEN_EMOJIS.HYBX || "•"} \`/pricehybx\` – Show price of HYBX`,
        `${TOKEN_EMOJIS.HYDX || "•"} \`/pricehydx\` – Show price of HYDX`,
        `${TOKEN_EMOJIS.CHT || "•"} \`/pricecht\` – Show price of CHT (ChatCoin)`,
        "",
        "• `/listcoins` – List all supported tokens & their commands",
        "• `/convert symbol:<TOKEN> amount:<AMOUNT>` – Convert token amount to USD & AUD",
        "• `/stats` – View the Alltra network statistics dashboard",
      ].join("\n")
    );
  }

  // 3) /convert – USD + AUD
  if (name === "convert") {
    const symbolInput = interaction.options.getString("symbol");
    const amount = interaction.options.getNumber("amount");

    if (!symbolInput || !amount || amount <= 0) {
      return interaction.reply(
        "⚠️ Please provide a valid symbol and a positive amount."
      );
    }

    const symbol = symbolInput.toUpperCase();
    const emoji = TOKEN_EMOJIS[symbol] || "";

    await interaction.deferReply();

    const prices = await fetchTokenPrices(symbol);
    if (!prices) {
      return interaction.editReply(
        `❌ I couldn't find prices for **${symbol}**.`
      );
    }

    const totalUsd = prices.usd * amount;
    const totalAud = prices.aud * amount;

    return interaction.editReply(
      [
        `💱 **Convert ${emoji} ${symbol} → USD & AUD**`,
        "",
        `• Token price: **$${prices.usd.toFixed(6)} USD** | **$${prices.aud.toFixed(6)} AUD**`,
        `• Amount: **${amount} ${symbol}**`,
        `• Total: **$${totalUsd.toFixed(6)} USD** | **$${totalAud.toFixed(6)} AUD**`,
      ].join("\n")
    );
  }

  // 4) /price... commands – show USD + AUD
  const symbol = PRICE_COMMAND_MAP[name];
  if (!symbol) return;

  await interaction.deferReply();

  const prices = await fetchTokenPrices(symbol);
  if (!prices) {
    return interaction.editReply(`⚠️ Could not fetch prices for ${symbol}`);
  }

  const usdStr = prices.usd.toFixed(6);
  const audStr = prices.aud.toFixed(6);
  const emoji = TOKEN_EMOJIS[symbol] || "💰";

  await interaction.editReply(
    [
      `${emoji} **${symbol}** price:`,
      `• **$${usdStr} USD**`,
      `• **$${audStr} AUD**`,
    ].join("\n")
  );
});

client.login(process.env.DISCORD_TOKEN);
