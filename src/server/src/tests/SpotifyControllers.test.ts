import { Request, Response } from "express";
import { SpotifyController } from "../controllers/SpotifyControllers";
import { SpotifyService } from "../service/SpotifyService";
import { pool } from "../config/database";

jest.mock("../service/SpotifyService");
jest.mock("../config/database");

describe("SpotifyController", () => {
  let spotifyController: SpotifyController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockConnection: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock connection
    mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    (pool.getConnection as jest.Mock).mockResolvedValue(mockConnection);

    // Mock request and response
    mockReq = {
      params: {
        username: "testuser",
        discordId: "123456",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    spotifyController = new SpotifyController();
  });

  describe("GetAndSaveUserProfile", () => {
    it("should save new user successfully", async () => {
      // Mock SpotifyService response
      const mockUser = {
        spotify_id: "spotify123",
        display_name: "Test User",
      };
      (SpotifyService.prototype.getUserProfile as jest.Mock).mockResolvedValue(
        mockUser
      );

      // Mock database queries
      mockConnection.query
        .mockResolvedValueOnce([[]]) // No existing user
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert result

      await spotifyController.GetAndSaveUserProfile(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User profile saved successfully",
        user: expect.objectContaining({ id: 1 }),
      });
    });

    it("should update existing user successfully", async () => {
      // Mock SpotifyService response
      const mockUser = {
        spotify_id: "spotify123",
        display_name: "Test User",
      };
      (SpotifyService.prototype.getUserProfile as jest.Mock).mockResolvedValue(
        mockUser
      );

      // Mock database queries
      mockConnection.query
        .mockResolvedValueOnce([[{ id: 1 }]]) // Existing user
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update result

      await spotifyController.GetAndSaveUserProfile(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should handle missing parameters", async () => {
      mockReq.params = {};

      await spotifyController.GetAndSaveUserProfile(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith(
        "Username and Discord ID are required"
      );
    });

    it("should handle database errors", async () => {
      mockConnection.query.mockRejectedValue(new Error("Database error"));

      await spotifyController.GetAndSaveUserProfile(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
