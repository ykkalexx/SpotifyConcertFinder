import { Request, Response } from "express";
import { SpotifyService } from "../service/SpotifyService";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

export class SpotifyController {
  private spotifyService: SpotifyService;

  constructor() {
    this.spotifyService = new SpotifyService();
  }

  // controller for user profile and save it to the database
  async GetAndSaveUserProfile(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const username = req.params.username;
      if (!username) {
        res.status(400).send("Username is required");
        return;
      }

      const user = await this.spotifyService.getUserProfile(username);

      //begin transaction
      await client.query("BEGIN");

      // Check if user already exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE spotify_id = $1",
        [user.spotify_id]
      );

      let userId;
      if (existingUser.rows.length > 0) {
        // updating user
        const result = await client.query(
          `UPDATE users 
             SET display_name = $1, updated_at = NOW() 
             WHERE spotify_id = $2 
             RETURNING id`,
          [user.display_name, user.spotify_id]
        );
        userId = result.rows[0].id;
        logger.info(`Updated user with ID: ${userId}`);
      } else {
        // creating new user
        const result = await client.query(
          `INSERT INTO users (spotify_id, display_name, created_at, updated_at) 
            VALUES ($1, $2, NOW(), NOW()) 
            RETURNING id`,
          [user.spotify_id, user.display_name]
        );
        userId = result.rows[0].id;
        logger.info(`Created new user with ID: ${userId}`);
      }

      await client.query("COMMIT");

      // Return success response
      res.status(200).json({
        message: "User profile saved successfully",
        user: { ...user, id: userId },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error saving user profile:", error);
      res.status(500).send("Failed to save user profile");
    } finally {
      client.release();
    }
  }

  // controller for saving user's top artists
  async GetAndSaveTopArtists(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const username = req.params.username;
      if (!username) {
        res.status(400).json({ error: "Username is required" });
        return;
      }

      // Get user's top artists from Spotify
      const artists = await this.spotifyService.getUserTopArtists(username);

      // Get user ID
      const userResult = await client.query(
        "SELECT id FROM users WHERE spotify_id = $1",
        [username]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userId = userResult.rows[0].id;

      await client.query("BEGIN");

      // Save each artist and create user-artist relationship
      const savedArtists = [];
      for (const artist of artists) {
        // Check if artist exists
        let artistId;
        const existingArtist = await client.query(
          "SELECT id FROM artists WHERE spotify_id = $1",
          [artist.spotify_id]
        );

        if (existingArtist.rows.length > 0) {
          // Update existing artist
          artistId = existingArtist.rows[0].id;
          await client.query(
            `UPDATE artists 
             SET name = $1, genres = $2, popularity = $3, updated_at = NOW()
             WHERE id = $4`,
            [artist.name, artist.genres, artist.popularity, artistId]
          );
        } else {
          // Insert new artist
          const newArtist = await client.query(
            `INSERT INTO artists (spotify_id, name, genres, popularity, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id`,
            [artist.spotify_id, artist.name, artist.genres, artist.popularity]
          );
          artistId = newArtist.rows[0].id;
        }

        // Upsert user_artists relationship
        await client.query(
          `INSERT INTO user_artists (user_id, artist_id, last_listened, play_count, created_at, updated_at)
           VALUES ($1, $2, NOW(), 1, NOW(), NOW())
           ON CONFLICT (user_id, artist_id) 
           DO UPDATE SET play_count = user_artists.play_count + 1, 
                        last_listened = NOW(),
                        updated_at = NOW()`,
          [userId, artistId]
        );

        savedArtists.push({ ...artist, id: artistId });
      }

      await client.query("COMMIT");

      res.status(200).json({
        message: "Top artists saved successfully",
        artists: savedArtists,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error saving top artists:", error);
      res.status(500).json({
        error: "Failed to save top artists",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      client.release();
    }
  }
}
