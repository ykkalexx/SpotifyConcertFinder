import { Request, Response } from "express";
import { SpotifyService } from "../service/SpotifyService";
import { pool } from "../config/database";
import { logger } from "../utils/logger";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export class SpotifyController {
  private spotifyService: SpotifyService;

  constructor() {
    this.spotifyService = new SpotifyService();
  }

  async GetAndSaveUserProfile(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const { username, discordId } = req.params;
      if (!username || !discordId) {
        res.status(400).send("Username and Discord ID are required");
        return;
      }

      const user = await this.spotifyService.getUserProfile(
        username,
        discordId
      );

      await connection.beginTransaction();

      // Check if user already exists
      const [existingUsers] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE discord_id = ?",
        [discordId]
      );

      let userId;
      if (existingUsers.length > 0) {
        // updating user
        const [result] = await connection.query<ResultSetHeader>(
          `UPDATE users 
           SET spotify_id = ?, display_name = ?, updated_at = NOW() 
           WHERE discord_id = ?`,
          [user.spotify_id, user.display_name, discordId]
        );
        userId = existingUsers[0].id;
        logger.info(`Updated user with ID: ${userId}`);
      } else {
        // creating new user
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO users (discord_id, spotify_id, display_name, created_at, updated_at) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [discordId, user.spotify_id, user.display_name]
        );
        userId = result.insertId;
        logger.info(`Created new user with ID: ${userId}`);
      }

      await connection.commit();

      res.status(200).json({
        message: "User profile saved successfully",
        user: { ...user, id: userId },
      });
    } catch (error) {
      await connection.rollback();
      logger.error("Error saving user profile:", error);
      res.status(500).send("Failed to save user profile");
    } finally {
      connection.release();
    }
  }

  async GetAndSaveTopArtists(req: Request, res: Response): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const { discordId } = req.params;
      if (!discordId) {
        res.status(400).json({ error: "Discord ID is required" });
        return;
      }

      // Get user ID
      const [users] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE discord_id = ?",
        [discordId]
      );

      if (users.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userId = users[0].id;

      const artists = await this.spotifyService.getUserTopArtists(discordId);

      await connection.beginTransaction();

      const savedArtists = [];
      for (const artist of artists) {
        // Check if artist exists
        const [existingArtists] = await connection.query<RowDataPacket[]>(
          "SELECT id FROM artists WHERE spotify_id = ?",
          [artist.spotify_id]
        );

        let artistId;
        if (existingArtists.length > 0) {
          artistId = existingArtists[0].id;
          await connection.query(
            `UPDATE artists 
             SET name = ?, genres = ?, popularity = ?, updated_at = NOW()
             WHERE id = ?`,
            [
              artist.name,
              JSON.stringify(artist.genres),
              artist.popularity,
              artistId,
            ]
          );
        } else {
          // Insert new artist
          const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO artists (spotify_id, name, genres, popularity, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [
              artist.spotify_id,
              artist.name,
              JSON.stringify(artist.genres),
              artist.popularity,
            ]
          );
          artistId = result.insertId;
        }

        // Upsert user_artists relationship
        await connection.query(
          `INSERT INTO user_artists (user_id, artist_id, last_listened, play_count, created_at, updated_at)
           VALUES (?, ?, NOW(), 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE 
             play_count = play_count + 1,
             last_listened = NOW(),
             updated_at = NOW()`,
          [userId, artistId]
        );

        savedArtists.push({
          ...artist,
          id: artistId,
          genres:
            typeof artist.genres === "string"
              ? JSON.parse(artist.genres)
              : artist.genres,
        });
      }

      await connection.commit();

      res.status(200).json({
        message: "Top artists saved successfully",
        artists: savedArtists,
      });
    } catch (error) {
      await connection.rollback();
      logger.error("Error saving top artists:", error);
      res.status(500).json({
        error: "Failed to save top artists",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      connection.release();
    }
  }
}
