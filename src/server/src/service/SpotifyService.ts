import SpotifyWebApi from "spotify-web-api-node";
import { pool } from "../config/database";
import { logger } from "../utils/logger";
import { RowDataPacket } from "mysql2";

interface SpotifyToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface SpotifyProfile {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
}

interface SpotifyArtist {
  id: string;
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
    });
  }

  createAuthURL(redirectUri: string, scopes: string[], state: string): string {
    this.spotify.setRedirectURI(redirectUri);
    return this.spotify.createAuthorizeURL(scopes, state);
  }

  async exchangeCode(code: string, redirectUri: string): Promise<SpotifyToken> {
    this.spotify.setRedirectURI(redirectUri);
    const data = await this.spotify.authorizationCodeGrant(code);
    return {
      access_token: data.body.access_token,
      refresh_token: data.body.refresh_token,
      expires_in: data.body.expires_in,
    };
  }

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
      logger.info(`Stored tokens for Discord user: ${discordId}`);
    } catch (error) {
      logger.error("Error storing user tokens:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

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

  async getUserProfile(discordId: string): Promise<SpotifyProfile> {
    const token = await this.getUserToken(discordId);
    if (!token) {
      throw new Error("User not authenticated with Spotify");
    }

    this.spotify.setAccessToken(token);

    try {
      const response = await this.spotify.getMe();

      if (response.statusCode !== 200) {
        throw new Error("Failed to fetch user profile from Spotify");
      }

      const profile: SpotifyProfile = {
        id: response.body.id,
        display_name: response.body.display_name || response.body.id,
        email: response.body.email,
        images: response.body.images,
      };

      // Store or update user profile in database
      const connection = await pool.getConnection();
      try {
        await connection.query(
          `INSERT INTO users (discord_id, spotify_id, display_name, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             spotify_id = ?,
             display_name = ?,
             updated_at = NOW()`,
          [
            discordId,
            profile.id,
            profile.display_name,
            profile.id,
            profile.display_name,
          ]
        );
      } finally {
        connection.release();
      }

      return profile;
    } catch (error) {
      logger.error("Error fetching user profile from Spotify:", error);
      throw error;
    }
  }

  async getUserTopArtists(discordId: string): Promise<SpotifyArtist[]> {
    const token = await this.getUserToken(discordId);
    if (!token) {
      throw new Error("User not authenticated with Spotify");
    }

    this.spotify.setAccessToken(token);

    try {
      const response = await this.spotify.getMyTopArtists({
        limit: 5,
        time_range: "short_term",
      });

      if (response.statusCode !== 200) {
        throw new Error("Failed to fetch top artists from Spotify");
      }

      const artists: SpotifyArtist[] = response.body.items.map((item) => ({
        id: item.id,
        name: item.name,
        genres: item.genres,
        popularity: item.popularity,
        images: item.images,
      }));

      // Store or update artists in database
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        for (const artist of artists) {
          // Insert or update artist
          await connection.query(
            `INSERT INTO artists (spotify_id, name, genres, popularity, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
               name = ?,
               genres = ?,
               popularity = ?,
               updated_at = NOW()`,
            [
              artist.id,
              artist.name,
              JSON.stringify(artist.genres),
              artist.popularity,
              artist.name,
              JSON.stringify(artist.genres),
              artist.popularity,
            ]
          );

          // Get the user's ID
          const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE discord_id = ?",
            [discordId]
          );

          if (users.length > 0) {
            // Get the artist's ID
            const [artists] = await connection.query<RowDataPacket[]>(
              "SELECT id FROM artists WHERE spotify_id = ?",
              [artist.id]
            );

            if (artists.length > 0) {
              // Update user_artists relation
              await connection.query(
                `INSERT INTO user_artists (user_id, artist_id, last_listened, play_count, created_at, updated_at)
                 VALUES (?, ?, NOW(), 1, NOW(), NOW())
                 ON DUPLICATE KEY UPDATE
                   play_count = play_count + 1,
                   last_listened = NOW(),
                   updated_at = NOW()`,
                [users[0].id, artists[0].id]
              );
            }
          }
        }

        await connection.commit();
        return artists;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error("Error fetching top artists from Spotify:", error);
      throw error;
    }
  }

  async disconnectUser(discordId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM user_tokens WHERE discord_id = ?", [
        discordId,
      ]);
      logger.info(`Disconnected Spotify for Discord user: ${discordId}`);
    } catch (error) {
      logger.error("Error disconnecting user:", error);
      throw error;
    } finally {
      connection.release();
    }
  }
}
