import { logger } from "../utils/logger";
import axios from "axios";

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      dateTime: string;
      localDate: string;
      localTime: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city: { name: string };
      state: { name: string };
      country: { name: string };
    }>;
  };
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
}

export interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page: {
    totalElements: number;
    totalPages: number;
  };
}

export class TicketmasterService {
  private readonly apiKey: string;
  private readonly rootUrl: string =
    "https://app.ticketmaster.com/discovery/v2/events";

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("Ticketmaster API key is required");
    }
  }

  async searchConcertsByArtist(
    artistName: string,
    city?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TicketmasterEvent[]> {
    try {
      const params = new URLSearchParams({
        apikey: this.apiKey,
        keyword: artistName,
        classificationName: "music",
        size: "20",
        sort: "date,asc",
      });

      if (city) params.append("city", city);
      if (startDate) params.append("startDateTime", startDate);
      if (endDate) params.append("endDateTime", endDate);

      const response = await axios.get<TicketmasterResponse>(
        `${this.rootUrl}?${params.toString()}`
      );

      return response.data._embedded?.events || [];
    } catch (error) {
      logger.error("Error searching concerts:", error);
      throw new Error("Failed to fetch concerts from Ticketmaster");
    }
  }

  async getEventDetails(eventId: string): Promise<TicketmasterEvent> {
    try {
      const response = await axios.get<TicketmasterEvent>(
        `${this.rootUrl}/${eventId}`,
        {
          params: {
            apikey: this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Error fetching event details:", error);
      throw new Error("Failed to fetch event details from Ticketmaster");
    }
  }
}
