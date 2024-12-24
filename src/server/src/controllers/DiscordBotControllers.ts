import { Request, Response } from "express";
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
      const { discord_id, username } = req.params;
      if (!username || !discord_id) {
        res.status(400).send("Username or Discord ID is required");
        return;
      }

      const token = axios.post(
        `${this.backendUrl}/spotify/store-token/${discord_id}`
      );

      const user = axios.get(
        `${this.backendUrl}/spotify/get_profile/${username}`
      );

      const artists = axios.get(
        `${this.backendUrl}/spotify/get_top_artists/${username}`
      );

      const [userData, artistsData, userToken] = await Promise.all([
        user,
        artists,
        token,
      ]);

      res.status(200).send({
        user: userData.data,
        artists: artistsData.data,
        token: userToken.data,
      });
    } catch (error) {
      logger.error("Error saving user profile:", error);
      res.status(500).send("Failed to save user profile");
    }
  }
}
