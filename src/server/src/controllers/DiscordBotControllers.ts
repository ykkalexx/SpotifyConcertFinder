import { Request, Response } from "express";
import { logger } from "../utils/logger";
import axios from "axios";

export class DiscordBotControllers {
  private backendUrl: string = "http://localhost:3000/api/v1";

  async fetchUserInfo(req: Request, res: Response): Promise<void> {
    try {
      const { discord_id } = req.params;
      if (!discord_id) {
        res.status(400).send("Discord ID is required");
        return;
      }

      try {
        const [userResponse, artistsResponse] = await Promise.all([
          axios.get(`${this.backendUrl}/spotify/profile/${discord_id}`),
          axios.get(`${this.backendUrl}/spotify/top-artists/${discord_id}`),
        ]);

        res.status(200).json({
          connected: true,
          user: userResponse.data,
          artists: artistsResponse.data,
        });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // User needs to authenticate
          const authUrl = `${this.backendUrl}/spotify/auth/${discord_id}`;
          res.status(200).json({
            connected: false,
            authUrl,
            message: "🎵 Connect your Spotify account",
          });
          return;
        }
        throw error;
      }
    } catch (error) {
      logger.error("Error in fetchUserInfo:", error);
      res.status(500).json({
        error: "Something went wrong",
        message: "Failed to process your request",
      });
    }
  }

  async fetchConcerts(req: Request, res: Response): Promise<void> {
    try {
      const { discord_id } = req.params;
      if (!discord_id) {
        res.status(400).send("Discord ID is required");
      }

      const concertsResponse = await axios.get(
        `${this.backendUrl}/ticketmaster/events/${discord_id}`
      );

      res.status(200).json({
        concerts: concertsResponse.data,
      });
    } catch (error) {
      logger.error("Error in fetchConcerts:", error);
      res.status(500).json({
        error: "Something went wrong",
        message: "Failed to process your request",
      });
    }
  }
}
