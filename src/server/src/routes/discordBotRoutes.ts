import { Router } from "express";
import { DiscordBotControllers } from "../controllers/DiscordBotControllers";

const discordBotRoutes = Router();
const discordBot = new DiscordBotControllers();

discordBotRoutes.get(
  "/discord/fetch_user_info/:discord_id/:username",
  (req, res) => discordBot.fetchUserInfo(req, res)
);

export default discordBotRoutes;
