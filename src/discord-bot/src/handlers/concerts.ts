import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios, { AxiosError } from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000/api/v1";

export async function handleConcertsCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;
    const response = await axios.get(
      `${BACKEND_URL}/ticketmaster/events/${discordId}`
    );

    if (response.data.success) {
      const concerts = response.data.concerts;

      // Split concerts into chunks of 2
      // due to rate limit of ticketmaster api
      const embedFields = concerts.slice(0, 2).map((concert: any) => ({
        name: concert.name,
        value: `Date: ${concert.date}\nVenue: ${concert.venue}, ${
          concert.city
        }\nPrice: ${concert.price?.min ?? "N/A"} - ${
          concert.price?.max ?? "N/A"
        } ${concert.price?.currency ?? ""}`,
      }));

      const embed = new EmbedBuilder()
        .setTitle("Upcoming Concerts")
        .setColor("#FF0000")
        .setDescription(
          `Found ${concerts.length} concerts for your top artists. Showing first 20:`
        )
        .addFields(embedFields);

      await interaction.editReply({ embeds: [embed] });
    } else {
      const errorEmbed = new EmbedBuilder()
        .setTitle("Error")
        .setColor("#FF0000")
        .setDescription(
          "No concerts found. Try connecting your Spotify account first."
        );

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  } catch (error) {
    console.error("Concerts command error:", error);
    const errorEmbed = new EmbedBuilder()
      .setTitle("Error")
      .setColor("#FF0000")
      .setDescription("Failed to fetch concerts. Please try again later.");

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
