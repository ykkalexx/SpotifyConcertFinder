import { ChatInputCommandInteraction } from "discord.js";
import { handleSpotifyCommand } from "./spotify";
import { handleConcertsCommand } from "./concerts";

export async function handleCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  try {
    switch (commandName) {
      case "spotify":
        await handleSpotifyCommand(interaction);
        break;
      case "concerts":
        await handleConcertsCommand(interaction);
        break;
      default:
        await interaction.reply("Sorry, I don't know that command!");
    }
  } catch (error) {
    console.error("Error handling command:", error);
    await interaction.reply(
      "Sorry, there was an error processing your request!"
    );
  }
}
