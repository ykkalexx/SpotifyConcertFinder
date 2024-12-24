import { Router, Request, Response } from "express";
import { SpotifyController } from "../controllers/SpotifyControllers";
import { logger } from "../utils/logger";
import { SpotifyService } from "../service/SpotifyService";

const spotifyRoutes = Router();
const spotifyService = new SpotifyService();
const spotify = new SpotifyController();

interface TokenRequestBody {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Updated routes to include Discord ID
spotifyRoutes.get(
  "/spotify/get_profile/:discordId/:username",
  (req: Request, res: Response) => spotify.GetAndSaveUserProfile(req, res)
);

spotifyRoutes.get(
  "/spotify/get_top_artists/:discordId",
  (req: Request, res: Response) => spotify.GetAndSaveTopArtists(req, res)
);

// Endpoint for linking Spotify account (will be called by Discord bot)
spotifyRoutes.post(
  "/spotify/store-token/:discordId",
  async (
    req: Request<{ discordId: string }, {}, TokenRequestBody>,
    res: Response
  ) => {
    const { access_token, refresh_token, expires_in } = req.body;
    const { discordId } = req.params;

    if (!access_token || !refresh_token || !expires_in || !discordId) {
      return res.status(400).json({
        error: "Missing required token information",
      });
    }

    try {
      await spotifyService.storeUserTokens(discordId, {
        access_token,
        refresh_token,
        expires_in,
      });
      res.status(200).json({ message: "Tokens stored successfully" });
    } catch (error) {
      logger.error("Error storing tokens:", error);
      res.status(500).json({ error: "Failed to store tokens" });
    }
  }
);

export default spotifyRoutes;
