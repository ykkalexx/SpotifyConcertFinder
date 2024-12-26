import { Request, Response, NextFunction } from "express";
import { SpotifyService } from "../service/SpotifyService";

interface SpotifyRequest extends Request {
  spotifyToken?: string;
}

export async function authenticateSpotify(
  req: SpotifyRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { discordId } = req.params;
    const spotifyService = new SpotifyService();

    const token = await spotifyService.getUserToken(discordId);
    if (!token) {
      return res.status(401).json({
        error: "Spotify authentication required",
        authUrl: `/api/spotify/auth/${discordId}`,
      });
    }

    req.spotifyToken = token;
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
}
