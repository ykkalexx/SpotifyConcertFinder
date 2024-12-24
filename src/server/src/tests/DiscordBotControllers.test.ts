import { Request, Response } from "express";
import { DiscordBotControllers } from "../controllers/DiscordBotControllers";
import { SpotifyController } from "../controllers/SpotifyControllers";
import axios from "axios";
import { logger } from "../utils/logger";

jest.mock("axios");
jest.mock("../utils/logger");
jest.mock("../controllers/SpotifyControllers");

describe("DiscordBotControllers", () => {
  let discordBotController: DiscordBotControllers;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {
        username: "testuser",
        discord_id: "123456",
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    discordBotController = new DiscordBotControllers();
  });

  describe("fetchUserInfo", () => {
    it("should fetch user info successfully", async () => {
      const mockUserData = { data: { id: 1, name: "Test User" } };
      const mockArtistsData = { data: [{ id: 1, name: "Artist 1" }] };
      const mockTokenData = { data: { access_token: "token123" } };

      (axios.post as jest.Mock).mockResolvedValueOnce(mockTokenData);
      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockUserData)
        .mockResolvedValueOnce(mockArtistsData);

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith({
        user: mockUserData.data,
        artists: mockArtistsData.data,
        token: mockTokenData.data,
      });
    });

    it("should handle missing parameters", async () => {
      mockReq.params = {};

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith(
        "Username or Discord ID is required"
      );
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      (axios.post as jest.Mock).mockRejectedValueOnce(error);

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith("Failed to save user profile");
    });

    it("should make API calls with correct URLs", async () => {
      const mockData = { data: {} };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockData);
      (axios.get as jest.Mock)
        .mockResolvedValueOnce(mockData)
        .mockResolvedValueOnce(mockData);

      await discordBotController.fetchUserInfo(
        mockReq as Request,
        mockRes as Response
      );

      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/spotify/store-token/123456"
      );
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/spotify/get_profile/testuser"
      );
      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/spotify/get_top_artists/testuser"
      );
    });
  });
});
