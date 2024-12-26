import { ChatInputCommandInteraction } from "discord.js";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL;

export async function handleSpotifyCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const response = await axios.get(
      `${BACKEND_URL}/spotify/profile/${interaction.user.id}`
    );

    if (response.data.connected) {
      // user if already connected to spotify, will show the user's profile
      const { user, artists } = response.data;
      const artistsList = artists
        .map((artist: any) => `• ${artist.name}`)
        .join("\n");

      await interaction.editReply({
        content:
          `**Spotify Profile**\n` +
          `Name: ${user.display_name}\n\n` +
          `**Top Artists**\n${artistsList}`,
      });
    } else {
      // the user needs to connect their account
      const authResponse = await axios.get(
        `${BACKEND_URL}/spotify/auth/${interaction.user.id}`
      );

      await interaction.editReply({
        content:
          `Click this link to connect your Spotify account:\n` +
          `${authResponse.data.authUrl}\n\n` +
          `After connecting, use /spotify again to see your profile!`,
      });
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const authResponse = await axios.get(
        `${BACKEND_URL}/spotify/auth/${interaction.user.id}`
      );

      await interaction.editReply({
        content:
          `Please connect your Spotify account first!\n` +
          `Click here to connect: ${authResponse.data.authUrl}`,
      });
    } else {
      await interaction.editReply(
        "Sorry, there was an error processing your request!"
      );
    }
  }
}
