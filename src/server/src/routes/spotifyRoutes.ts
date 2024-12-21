import { Router } from "express";
import { SpotifyController } from "../controllers/SpotifyControllers";

const spotifyRoutes = Router();
const spotify = new SpotifyController();

spotifyRoutes.get("/spotify/get_profile/:username", (req, res) =>
  spotify.GetAndSaveUserProfile(req, res)
);

spotifyRoutes.get("/spotify/get_top_artists/:username", (req, res) =>
  spotify.GetAndSaveTopArtists(req, res)
);

export default spotifyRoutes;
