import SpotifyWebApi from "spotify-web-api-node";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}

interface User extends BaseEntity {
  spotify_id: string;
  display_name: string;
}

interface Artist extends BaseEntity {
  spotify_id: string;
  name: string;
  genres: string[];
  popularity: number;
}

export class SpotifyService {
  private spotify: SpotifyWebApi;

  constructor() {
    this.spotify = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
  }

  // function used to get spotify access token
  async authenticate(): Promise<void> {
    try {
      const data = await this.spotify.clientCredentialsGrant();
      this.spotify.setAccessToken(data.body.access_token);
      logger.info("Successfully authenticated with Spotify");
    } catch (error) {
      logger.error("Error authenticating with Spotify:", error);
      throw new Error("Failed to authenticate with Spotify");
    }
  }

  // function used to get user profile
  async getUserProfile(username: string): Promise<User> {
    try {
      await this.authenticate();
      const response = await this.spotify.getUser(username);

      if (response.statusCode !== 200) {
        throw new Error("Failed to fetch user profile from Spotify");
      }

      const user: User = {
        id: 0, // This will be set by database
        spotify_id: response.body.id,
        display_name: response.body.display_name || username,
        created_at: new Date(),
        updated_at: new Date(),
      };

      logger.info("Successfully fetched user profile from Spotify");
      return user;
    } catch (error) {
      logger.error("Error fetching user profile from Spotify:", error);
      throw new Error("Failed to fetch user profile from Spotify");
    }
  }

  // function used to get user top artists
  async getUserTopArtists(username: string): Promise<Artist[]> {
    try {
      await this.authenticate();
      const response = await this.spotify.getMyTopArtists({ limit: 5 });
      const artist = response.body.items.map((item) => {
        return {
          id: 0, // This will be set by database
          spotify_id: item.id,
          name: item.name,
          genres: item.genres,
          popularity: item.popularity,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      logger.info("Successfully fetched user top artists from Spotify");
      return artist;
    } catch (error) {
      logger.error(
        `Error fetching user top for ${username}  artists from Spotify:`,
        error
      );
      throw new Error("Failed to fetch user top artists from Spotify");
    }
  }
}
