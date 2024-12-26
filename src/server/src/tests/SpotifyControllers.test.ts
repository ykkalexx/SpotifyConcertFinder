import { Request, Response } from "express";
import { SpotifyController } from "../controllers/SpotifyControllers";
import { SpotifyService } from "../service/SpotifyService";
import { pool } from "../config/database";

interface SpotifyRequest extends Request {
  spotifyToken?: string;
}

jest.mock("../service/SpotifyService");
jest.mock("../config/database");

describe("SpotifyController", () => {
  let spotifyController: SpotifyController;
  let mockReq: Partial<SpotifyRequest>;
  let mockRes: Partial<Response>;
  let mockConnection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    (pool.getConnection as jest.Mock).mockResolvedValue(mockConnection);

    mockReq = {
      params: {
        discordId: "123456",
      },
      query: {
        code: "test-auth-code",
        state: "base64-encoded-discord-id",
      },
      spotifyToken: "mock-spotify-token",
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    spotifyController = new SpotifyController();
  });

  describe("initiateAuth", () => {
    it("should redirect to Spotify auth URL", async () => {
      const mockAuthUrl = "https://accounts.spotify.com/authorize...";
      (SpotifyService.prototype.createAuthURL as jest.Mock).mockReturnValue(
        mockAuthUrl
      );

      await spotifyController.initiateAuth(
        mockReq as SpotifyRequest,
        mockRes as Response
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(mockAuthUrl);
    });

    it("should handle missing discord ID", async () => {
      mockReq.params = {};

      await spotifyController.initiateAuth(
        mockReq as SpotifyRequest,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Discord ID is required",
      });
    });
  });

  describe("handleCallback", () => {
    it("should handle missing code", async () => {
      mockReq.query = {};

      await spotifyController.handleCallback(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("Failed to connect Spotify account")
      );
    });

    it("should handle successful callback", async () => {
      const mockCode = "test-auth-code";
      const mockState = Buffer.from("123456").toString("base64");
      mockReq.query = { code: mockCode, state: mockState };

      const mockTokens = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
      };

      (SpotifyService.prototype.exchangeCode as jest.Mock).mockResolvedValue(
        mockTokens
      );

      await spotifyController.handleCallback(
        mockReq as Request,
        mockRes as Response
      );

      expect(SpotifyService.prototype.storeUserTokens).toHaveBeenCalledWith(
        "123456", // decoded discord ID
        mockTokens
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining("Successfully connected")
      );
    });
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      const mockProfile = {
        id: "spotify-123",
        display_name: "Test User",
      };

      (SpotifyService.prototype.getUserProfile as jest.Mock).mockResolvedValue(
        mockProfile
      );

      await spotifyController.getProfile(
        mockReq as SpotifyRequest,
        mockRes as Response
      );

      expect(mockRes.json).toHaveBeenCalledWith(mockProfile);
    });
  });

  describe("getTopArtists", () => {
    it("should return top artists", async () => {
      const mockArtists = [
        { id: "artist-1", name: "Artist 1" },
        { id: "artist-2", name: "Artist 2" },
      ];

      (
        SpotifyService.prototype.getUserTopArtists as jest.Mock
      ).mockResolvedValue(mockArtists);

      await spotifyController.getTopArtists(
        mockReq as SpotifyRequest,
        mockRes as Response
      );

      expect(mockRes.json).toHaveBeenCalledWith(mockArtists);
    });
  });
});
