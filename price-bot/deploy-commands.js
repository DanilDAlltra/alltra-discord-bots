require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  { name: "priceall", description: "Show the price of ALL" },
  { name: "pricewall", description: "Show the price of WALL (Wrapped Alltra)" },
  { name: "price1111", description: "Show the price of 11::11" },
  { name: "priceusdc", description: "Show the price of USDC (AUSDC)" },
  { name: "priceusdt", description: "Show the price of USDT" },
  { name: "priceausdt", description: "Show the price of AUSDT" },
  { name: "priceauda", description: "Show the price of AUDA / MOOLA" },
  { name: "pricehybx", description: "Show the price of HYBX" },
  { name: "pricehydx", description: "Show the price of HYDX" },
  { name: "pricecht", description: "Show the price of CHT (ChatCoin)" },

  // New commands
  {
    name: "listcoins",
    description: "List all supported Alltra ecosystem coins",
  },
  {
    name: "convert",
    description: "Convert a token amount to USD & AUD",
    options: [
      {
        name: "symbol",
        type: 3, // STRING
        description: "Token symbol (e.g., ALL, WALL, HYBX)",
        required: true,
      },
      {
        name: "amount",
        type: 10, // NUMBER
        description: "Amount of the token you want to convert",
        required: true,
      },
    ],
  },
  {
    name: "commands",
    description: "Show all bot commands and usage help",
  },
  {
    name: "stats",
    description: "Show the link to the Alltra network statistics dashboard",
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Commands registered!");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
})();
