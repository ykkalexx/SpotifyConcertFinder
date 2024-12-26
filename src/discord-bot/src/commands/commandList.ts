import { SlashCommandBuilder } from "@discordjs/builders";

export const commands = [
  new SlashCommandBuilder()
    .setName("spotify")
    .setDescription("Connect your Spotify account or view your profile")
    .toJSON(),
];
