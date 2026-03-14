import { Router, Request, Response } from "express";
import { generateResponse } from "../services/groqService";
import { getCallContext } from "../services/supabaseService";
import { escapeXml } from "../utils/xml";

// Twilio POSTs here every time the dispatcher says something.
// Body includes:
//   SpeechResult — what the dispatcher said (transcribed by Twilio)
//   CallSid      — Twilio call identifier
//
// We look up the patient context from Supabase, send the dispatcher's
// message to Groq, and return TwiML that speaks the answer and listens again.

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const contextId = req.query.ctx as string | undefined;
  const dispatcherMessage = req.body.SpeechResult as string | undefined;

  res.set("Content-Type", "text/xml");

  if (!contextId || !dispatcherMessage) {
    return res.send(
      `<?xml version="1.0" encoding="UTF-8"?>` +
        `<Response><Say voice="alice">I'm sorry, I didn't catch that. Please send help to the location provided immediately.</Say></Response>`
    );
  }

  try {
    const context = await getCallContext(contextId);
    const answer = await generateResponse(context, dispatcherMessage);
    const respondUrl = `${process.env.PUBLIC_URL}/api/respond?ctx=${contextId}`;

    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(answer)}</Say>
  <Gather input="speech" action="${respondUrl}" method="POST" timeout="10" speechTimeout="auto">
    <Say voice="alice">Is there anything else?</Say>
  </Gather>
  <Say voice="alice">Thank you. Please send help to the location provided immediately. Goodbye.</Say>
</Response>`
    );
  } catch (err) {
    console.error("Respond error:", err);
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>` +
        `<Response><Say voice="alice">I'm unable to respond right now. Please send help to the location provided immediately.</Say></Response>`
    );
  }
});

export default router;
