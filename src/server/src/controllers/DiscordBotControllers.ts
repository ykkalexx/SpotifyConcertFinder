import { Request, Response } from "express";
import { pool } from "../config/database";
import { logger } from "../utils/logger";
import { SpotifyController } from "./SpotifyControllers";
import axios from "axios";

export class DiscordBotControllers {
  private spotifyController: SpotifyController;
  private backendUrl: string = "http://localhost:3000/api/v1";

  constructor() {
    this.spotifyController = new SpotifyController();
  }

  async fetchUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
      if (!username) {
        res.status(400).send("Username is required");
        return;
      }

      const user = axios.get(
        `${this.backendUrl}/spotify/get_profile/${username}`
      );

      const artists = axios.get(
        `${this.backendUrl}/spotify/get_top_artists/${username}`
      );

      const [userData, artistsData] = await Promise.all([user, artists]);

      res.status(200).send({ user: userData.data, artists: artistsData.data });
    } catch (error) {
      logger.error("Error saving user profile:", error);
      res.status(500).send("Failed to save user profile");
    }
  }
}
