import { Request, Response } from "express";
import { TicketmasterService } from "../service/TicketmasterService";
import { logger } from "../utils/logger";

export class TicketmasterControllers {
  private ticketmasterService: TicketmasterService;

  constructor() {
    this.ticketmasterService = new TicketmasterService();
  }

  getConcerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { discordId } = req.params;

      if (!discordId) {
        res.status(400).json({ error: "Discord ID is required" });
        return;
      }

      const concerts = await this.ticketmasterService.getTopArtistConcerts(
        discordId
      );

      res.status(200).json({
        success: true,
        count: concerts.length,
        concerts: concerts.map((concert) => ({
          id: concert.id,
          name: concert.name,
          date: concert.dates.start.dateTime,
          venue: concert._embedded?.venues?.[0]?.name,
          city: concert._embedded?.venues?.[0]?.city.name,
          price: concert.priceRanges?.[0],
        })),
      });
    } catch (error) {
      logger.error("Error fetching concerts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch concerts",
      });
    }
  };
}
