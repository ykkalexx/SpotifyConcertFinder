import { Router } from "express";
import { SpotifyController } from "../controllers/SpotifyControllers";
import { authenticateSpotify } from "../middleware/auth";

const router = Router();
const spotifyController = new SpotifyController();

// Routes for OAuth flow
router.get("/auth/:discordId", spotifyController.initiateAuth);
router.get("/callback", spotifyController.handleCallback);

// Protected routes requiring Spotify authentication
router.get(
  "/profile/:discordId",
  authenticateSpotify,
  spotifyController.getProfile
);
router.get(
  "/top-artists/:discordId",
  authenticateSpotify,
  spotifyController.getTopArtists
);

export default router;
