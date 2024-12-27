import { logger } from "../utils/logger";
import axios from "axios";
import { SpotifyService } from "../service/SpotifyService";

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
  private spotifyService: SpotifyService;
  private rateLimitDelay = 1000; // 1000ms delay between requests due to ticketmaster rate limit

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY as string;
    this.spotifyService = new SpotifyService();
    if (!this.apiKey) throw new Error("Ticketmaster API key is required");
  }

  private async delayRequest(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
  }

  async searchConcertsByArtist(
    artistName: string,
    city?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TicketmasterEvent[]> {
    try {
      await this.delayRequest();

      // added so it only fetches future concerts
      // limited to 1 concert due to api limitations
      const today = new Date().toISOString().split(".")[0] + "Z";

      const params = new URLSearchParams({
        apikey: this.apiKey,
        keyword: artistName,
        classificationName: "music",
        size: "1",
        sort: "date,asc",
        startDateTime: startDate || today,
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

  async getTopArtistConcerts(discordId: string): Promise<TicketmasterEvent[]> {
    try {
      const topArtists = await this.spotifyService.getUserTopArtists(discordId);
      const concerts: TicketmasterEvent[] = [];

      // Take only top 5 artists
      for (const artist of topArtists.slice(0, 5)) {
        const artistConcerts = await this.searchConcertsByArtist(artist.name);
        concerts.push(...artistConcerts);
      }

      return concerts
        .sort((a, b) => {
          const dateA = new Date(a.dates.start.dateTime);
          const dateB = new Date(b.dates.start.dateTime);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 20);
    } catch (error) {
      logger.error("Error fetching artist concerts:", error);
      throw new Error("Failed to get concerts for top artists");
    }
  }
}
