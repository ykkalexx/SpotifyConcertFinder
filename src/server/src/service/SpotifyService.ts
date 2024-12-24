import SpotifyWebApi from "spotify-web-api-node";
import { logger } from "../utils/logger";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";
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
  discord_id?: string;
}

interface Artist extends BaseEntity {
  spotify_id: string;
  name: string;
  genres: string[];
  popularity: number;
}

interface SpotifyToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class SpotifyService {
  private spotify: SpotifyWebApi;

  constructor() {
    this.spotify = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  setAccessToken(token: string): void {
    this.spotify.setAccessToken(token);
  }

  // Store Spotify tokens for a Discord user
  async storeUserTokens(
    discordId: string,
    tokens: SpotifyToken
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `INSERT INTO user_tokens 
         (discord_id, access_token, refresh_token, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, NOW() + INTERVAL ? SECOND, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         access_token = ?, 
         refresh_token = ?,
         expires_at = NOW() + INTERVAL ? SECOND,
         updated_at = NOW()`,
        [
          discordId,
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
        ]
      );
    } finally {
      connection.release();
    }
  }

  // Get stored token for a Discord user
  async getUserToken(discordId: string): Promise<string | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT access_token, refresh_token, expires_at 
         FROM user_tokens 
         WHERE discord_id = ?`,
        [discordId]
      );

      if (!rows.length) {
        return null;
      }

      // Check if token needs refresh
      const expiresAt = new Date(rows[0].expires_at);
      if (expiresAt < new Date()) {
        // Token expired, refresh it
        this.spotify.setRefreshToken(rows[0].refresh_token);
        const refreshedTokens = await this.spotify.refreshAccessToken();
        await this.storeUserTokens(discordId, {
          access_token: refreshedTokens.body.access_token,
          refresh_token:
            refreshedTokens.body.refresh_token || rows[0].refresh_token,
          expires_in: refreshedTokens.body.expires_in,
        });
        return refreshedTokens.body.access_token;
      }

      return rows[0].access_token;
    } catch (error) {
      logger.error("Error getting user token:", error);
      return null;
    } finally {
      connection.release();
    }
  }

  // Get user profile
  async getUserProfile(username: string, discordId: string): Promise<User> {
    try {
      const token = await this.getUserToken(discordId);
      if (!token) {
        throw new Error("User not authenticated with Spotify");
      }

      this.setAccessToken(token);
      const response = await this.spotify.getUser(username);

      if (response.statusCode !== 200) {
        throw new Error("Failed to fetch user profile from Spotify");
      }

      const user: User = {
        id: 0,
        spotify_id: response.body.id,
        display_name: response.body.display_name || username,
        discord_id: discordId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      logger.info("Successfully fetched user profile from Spotify");
      return user;
    } catch (error) {
      logger.error("Error fetching user profile from Spotify:", error);
      throw error;
    }
  }

  // Get user top artists
  async getUserTopArtists(discordId: string): Promise<Artist[]> {
    try {
      const token = await this.getUserToken(discordId);
      if (!token) {
        throw new Error("User not authenticated with Spotify");
      }

      this.setAccessToken(token);
      const response = await this.spotify.getMyTopArtists({ limit: 5 });

      const artists = response.body.items.map((item) => ({
        id: 0,
        spotify_id: item.id,
        name: item.name,
        genres: item.genres,
        popularity: item.popularity,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      logger.info("Successfully fetched user top artists from Spotify");
      return artists;
    } catch (error) {
      logger.error("Error fetching user top artists from Spotify:", error);
      throw error;
    }
  }
}
