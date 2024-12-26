import { Request, Response } from "express";
import { SpotifyService } from "../service/SpotifyService";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

export class SpotifyController {
  private spotifyService: SpotifyService;
  private readonly redirectUri: string;

  constructor() {
    this.spotifyService = new SpotifyService();
    this.redirectUri =
      process.env.SPOTIFY_REDIRECT_URI ||
      "http://localhost:3000/api/v1/spotify/callback";
  }

  initiateAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const { discordId } = req.params;
      if (!discordId) {
        res.status(400).json({ error: "Discord ID is required" });
        return;
      }

      const state = Buffer.from(discordId).toString("base64");
      const scopes = ["user-read-private", "user-top-read"];

      const authUrl = this.spotifyService.createAuthURL(
        this.redirectUri,
        scopes,
        state
      );

      res.redirect(authUrl);
    } catch (error) {
      logger.error("Error initiating auth:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  };

  handleCallback = async (req: Request, res: Response): Promise<void> => {
    const { code, state } = req.query;

    try {
      if (!code || !state) {
        throw new Error("Missing code or state parameter");
      }

      const discordId = Buffer.from(state as string, "base64").toString();
      const tokens = await this.spotifyService.exchangeCode(
        code as string,
        this.redirectUri
      );

      await this.spotifyService.storeUserTokens(discordId, tokens);

      // Redirect to success page or close window
      res.send("Successfully connected Spotify! You can close this window.");
    } catch (error) {
      logger.error("Error handling callback:", error);
      res.status(500).send("Failed to connect Spotify account");
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { discordId } = req.params;
      const profile = await this.spotifyService.getUserProfile(discordId);
      res.json(profile);
    } catch (error) {
      logger.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  };

  getTopArtists = async (req: Request, res: Response): Promise<void> => {
    try {
      const { discordId } = req.params;
      const artists = await this.spotifyService.getUserTopArtists(discordId);
      res.json(artists);
    } catch (error) {
      logger.error("Error fetching top artists:", error);
      res.status(500).json({ error: "Failed to fetch top artists" });
    }
  };
}
