import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios, { AxiosError } from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000/api/v1";

export async function handleSpotifyCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    try {
      const response = await axios.get(
        `${BACKEND_URL}/discord/fetch_user_info/${interaction.user.id}`
      );

      if (response.data.connected) {
        // User is connected - show profile
        const embed = new EmbedBuilder()
          .setTitle("Spotify Profile")
          .setColor("#1DB954") // Spotify green
          .addFields(
            { name: "Profile", value: response.data.user.display_name },
            {
              name: "Top Artists",
              value:
                response.data.artists
                  .map((artist: any) => `• ${artist.name}`)
                  .join("\n") || "No top artists found",
            }
          );

        await interaction.editReply({ embeds: [embed] });
      } else {
        // User needs to connect - show auth URL
        const embed = new EmbedBuilder()
          .setTitle("Connect Spotify")
          .setColor("#1DB954")
          .setDescription(
            "Click the link below to connect your Spotify account:"
          )
          .addFields({
            name: "Authentication Link",
            value: response.data.authUrl,
          });

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Spotify command error:", error);

      const errorEmbed = new EmbedBuilder()
        .setTitle("Error")
        .setColor("#FF0000")
        .setDescription(
          "Failed to connect to Spotify. Please try again later."
        );

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  } catch (error) {
    console.error("Critical error:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content: "A critical error occurred. Please try again.",
        ephemeral: true,
      });
    }
  }
}
