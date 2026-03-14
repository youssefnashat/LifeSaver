import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { storeCallContext } from "../services/supabaseService";
import { placeCall } from "../services/twilioService";

// FRONTEND INTEGRATION POINT
// Called by the frontend when the user confirms the emergency.
//
// Expected request body:
//   {
//     type: "police" | "fire" | "ems",
//     address: string,
//     coords: { lat: number, lng: number },
//     zones?: string[],   // EMS only — e.g. ["chest", "left_arm"]
//     age?: number
//   }
//
// Response:
//   { success: true, callSid: string }

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  // --- Uncomment when frontend is ready to integrate ---
  //
  // const { type, address, zones, age } = req.body;
  //
  // if (!type || !address) {
  //   return res.status(400).json({ error: "type and address are required" });
  // }
  //
  // // 1. Generate a unique ID to link the call context across requests
  // const contextId = randomUUID();
  //
  // // 2. Store patient context in Supabase — looked up by /api/twiml and /api/respond
  // await storeCallContext(contextId, { type, address, zones, age });
  //
  // // 3. Build the TwiML URL — Twilio fetches this when the call connects
  // const twimlUrl = `${process.env.PUBLIC_URL}/api/twiml?ctx=${contextId}`;
  //
  // // 4. Place the outbound call via Twilio
  // const callSid = await placeCall(twimlUrl);
  //
  // return res.json({ success: true, callSid });
  // ---

  res.status(503).json({ error: "Not yet integrated" });
});

export default router;
