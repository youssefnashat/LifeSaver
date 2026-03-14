import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import callRouter from "./routes/call";
import geocodeRouter from "./routes/geocode";
import twimlRouter from "./routes/twiml";
import respondRouter from "./routes/respond";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
// Twilio posts form-encoded data to /api/respond
app.use(express.urlencoded({ extended: false }));

// Twilio webhooks — must be reachable at PUBLIC_URL
app.use("/api/twiml", twimlRouter);
app.use("/api/respond", respondRouter);

// Frontend integration points — uncomment route bodies in each file when frontend is ready
app.use("/api/call", callRouter);
app.use("/api/geocode", geocodeRouter);

app.listen(PORT, () => {
  console.log(`EmergiBridge backend running on port ${PORT}`);
});
