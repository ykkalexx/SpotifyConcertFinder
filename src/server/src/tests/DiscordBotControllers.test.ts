import { Request, Response } from "express";
import { DiscordBotControllers } from "../controllers/DiscordBotControllers";
import axios from "axios";
import { logger } from "../utils/logger";

jest.mock("axios");
jest.mock("../utils/logger");

describe("DiscordBotControllers", () => {
  let discordBotController: DiscordBotControllers;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const backendUrl = "http://localhost:3000/api/v1";

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {
        discord_id: "123456",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    discordBotController = new DiscordBotControllers();
  });

  describe("fetchUserInfo", () => {
    it("should fetch user info successfully when authenticated", async () => {
      const mockUserData = {
        data: {
          id: "spotify-123",
          display_name: "Test User",
        },
      };
      const mockArtistsData = {
        data: [
          { id: "artist-1", name: "Artist 1" },
          { id: "artist-2", name: "Artist 2" },
        ],
      };

      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockUserData)
        .mockResolvedValueOnce(mockArtistsData);

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        connected: true,
        user: mockUserData.data,
        artists: mockArtistsData.data,
      });
    });

    it("should handle unauthenticated user and return auth URL", async () => {
      const mockAuthUrl = "https://accounts.spotify.com/authorize...";
      const error = {
        isAxiosError: true,
        response: { status: 401 },
      };

      // First Promise.all call fails with 401
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        // Auth URL request succeeds
        .mockResolvedValueOnce({ data: { authUrl: mockAuthUrl } });

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        connected: false,
        authUrl: mockAuthUrl,
        message: "Click this link to connect your Spotify account",
      });
    });

    it("should handle missing discord_id", async () => {
      mockReq.params = {};

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith("Discord ID is required");
    });

    it("should handle unexpected errors", async () => {
      const error = new Error("Unexpected error");
      (axios.get as jest.Mock).mockRejectedValueOnce(error);

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Error in fetchUserInfo:",
        error
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Something went wrong",
        message: "Failed to process your request",
      });
    });
  });
});
