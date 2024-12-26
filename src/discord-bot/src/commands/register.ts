import { REST, Routes } from "discord.js";
import { commands } from "./commandList";
import * as dotenv from "dotenv";

dotenv.config();

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

export async function registerCommands() {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });
  } catch (error) {
    console.error(error);
  }
}
