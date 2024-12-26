import { Client, GatewayIntentBits, Events } from "discord.js";
import * as dotenv from "dotenv";
import { registerCommands } from "./commands/register";
import { handleCommand } from "./handlers/commandHandlers";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  console.log("Bot is ready! 🎵");
  registerCommands().catch(console.error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleCommand(interaction);
});

client.login(process.env.DISCORD_TOKEN);
