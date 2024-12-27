import { Router } from "express";
import { TicketmasterControllers } from "../controllers/TicketmasterControllers";

const router = Router();
const ticketmasterController = new TicketmasterControllers();

router.get("/events/:discordId", ticketmasterController.getConcerts);

export default router;
