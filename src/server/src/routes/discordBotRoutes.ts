import { Router } from "express";
import { DiscordBotControllers } from "../controllers/DiscordBotControllers";

const discordBotRoutes = Router();
const discordBot = new DiscordBotControllers();

discordBotRoutes.get("/fetch_user_info/:discord_id", (req, res) =>
  discordBot.fetchUserInfo(req, res)
);

discordBotRoutes.get("/fetch_concerts/:discord_id", (req, res) =>
  discordBot.fetchConcerts(req, res)
);

export default discordBotRoutes;
