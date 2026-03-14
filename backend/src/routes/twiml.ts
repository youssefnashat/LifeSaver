import { Router, Request, Response } from "express";
import { generateOpeningScript } from "../services/groqService";
import { getCallContext } from "../services/supabaseService";
import { escapeXml } from "../utils/xml";

// Twilio fetches this when the call first connects.
// Reads patient context from Supabase, generates the opening script via Groq,
// speaks it with <Say>, then <Gather> listens for the dispatcher's response.

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const contextId = req.query.ctx as string | undefined;

  res.set("Content-Type", "text/xml");

  if (!contextId) {
    return res.send(
      `<?xml version="1.0" encoding="UTF-8"?>` +
        `<Response><Say voice="alice">Emergency assistance requested. Please send help immediately.</Say></Response>`
    );
  }

  try {
    const context = await getCallContext(contextId);
    const script = await generateOpeningScript(context);
    const respondUrl = `${process.env.PUBLIC_URL}/api/respond?ctx=${contextId}`;

    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(script)}</Say>
  <Gather input="speech" action="${respondUrl}" method="POST" timeout="10" speechTimeout="auto">
    <Say voice="alice">Please go ahead.</Say>
  </Gather>
  <Say voice="alice">We did not receive a response. Please send help to the location provided. Goodbye.</Say>
</Response>`
    );
  } catch (err) {
    console.error("TwiML error:", err);
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>` +
        `<Response><Say voice="alice">Emergency assistance has been requested. Please send help immediately.</Say></Response>`
    );
  }
});

export default router;
