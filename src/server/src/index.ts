import express from "express";
import dotenv from "dotenv";
import { closePool, initDB } from "./config/database";
import { logger } from "./utils/logger";
import spotifyRoutes from "./routes/spotifyRoutes";
import discordBotRoutes from "./routes/discordBotRoutes";
import ticketmasterRoutes from "./routes/ticketmasterRoutes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// setup router
app.use("/api/v1/spotify", spotifyRoutes);
app.use("/api/v1/discord", discordBotRoutes);
app.use("/api/v1/ticketmaster", ticketmasterRoutes);

async function startServer() {
  try {
    await initDB();
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    // Graceful shutdown handling
    process.on("SIGTERM", async () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(async () => {
        console.log("HTTP server closed");
        await closePool();
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT signal received: closing HTTP server");
      server.close(async () => {
        console.log("HTTP server closed");
        await closePool();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();
