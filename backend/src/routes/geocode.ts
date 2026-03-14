import { Router, Request, Response } from "express";

// Called by the frontend with raw GPS coords.
// Returns a human-readable street address via Nominatim (OpenStreetMap).
//
// Request body: { lat: number, lng: number }
// Response:     { address: string }

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { lat, lng } = req.body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "lat and lng are required numbers" });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

  const response = await fetch(url, {
    headers: { "User-Agent": "EmergiBridge/1.0" },
  });

  const data = await response.json() as {
    address?: {
      house_number?: string;
      road?: string;
      city?: string;
      town?: string;
      state?: string;
    };
  };

  if (!data.address) {
    return res.status(502).json({ error: "Could not resolve address" });
  }

  const { house_number, road, city, town, state } = data.address;
  const address = [house_number, road, city ?? town, state]
    .filter(Boolean)
    .join(", ");

  return res.json({ address });
});

export default router;
