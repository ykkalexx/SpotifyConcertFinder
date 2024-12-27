import { Request, Response } from "express";
import { TicketmasterControllers } from "../controllers/TicketmasterControllers";
import { TicketmasterService } from "../service/TicketmasterService";
import { logger } from "../utils/logger";

jest.mock("../service/TicketmasterService");
jest.mock("../utils/logger");

describe("TicketmasterControllers", () => {
  let ticketmasterController: TicketmasterControllers;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {
        discordId: "12342252",
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    ticketmasterController = new TicketmasterControllers();
  });

  describe("getConcerts", () => {
    const mockConcerts = [
      {
        id: "concert1",
        name: "Test Concert",
        dates: {
          start: {
            dateTime: "2024-01-01T20:00:00Z",
          },
        },
        _embedded: {
          venues: [
            {
              name: "Test Venue",
              city: { name: "Test City" },
            },
          ],
        },
        priceRanges: [
          {
            min: 50,
            max: 100,
            currency: "USD",
          },
        ],
      },
    ];

    it("should fetch concerts successfully", async () => {
      (
        TicketmasterService.prototype.getTopArtistConcerts as jest.Mock
      ).mockResolvedValue(mockConcerts);

      await ticketmasterController.getConcerts(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        concerts: [
          {
            id: "concert1",
            name: "Test Concert",
            date: "2024-01-01T20:00:00Z",
            venue: "Test Venue",
            city: "Test City",
            price: { min: 50, max: 100, currency: "USD" },
          },
        ],
      });
    });

    it("should handle missing discord ID", async () => {
      mockReq.params = {};

      await ticketmasterController.getConcerts(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Discord ID is required",
      });
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (
        TicketmasterService.prototype.getTopArtistConcerts as jest.Mock
      ).mockRejectedValue(error);

      await ticketmasterController.getConcerts(
        mockReq as Request,
        mockRes as Response
      );

      expect(logger.error).toHaveBeenCalledWith(
        "Error fetching concerts:",
        error
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to fetch concerts",
      });
    });

    it("should handle empty concert list", async () => {
      (
        TicketmasterService.prototype.getTopArtistConcerts as jest.Mock
      ).mockResolvedValue([]);

      await ticketmasterController.getConcerts(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        concerts: [],
      });
    });
  });
});
