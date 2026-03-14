import Groq from "groq-sdk";

function getClient() {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const ZONE_LABELS: Record<string, string> = {
  head: "head",
  chest: "chest",
  abdomen: "abdomen",
  left_arm: "left arm",
  right_arm: "right arm",
  left_leg: "left leg",
  right_leg: "right leg",
};

export interface CallContext {
  type: "police" | "fire" | "ems";
  address: string;
  zones?: string[];
  age?: number;
}

function buildPatientSummary(context: CallContext): string {
  const { type, address, zones, age } = context;

  const zoneText =
    zones && zones.length > 0
      ? zones.map((z) => ZONE_LABELS[z] ?? z).join(" and ")
      : null;

  const lines = [
    `Emergency type: ${type}`,
    `Location: ${address}`,
    age ? `Patient age: approximately ${age} years old` : "",
    zoneText ? `Reported pain in: ${zoneText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
}

// Generates the opening 911 script spoken when the call first connects.
export async function generateOpeningScript(context: CallContext): Promise<string> {
  const { type } = context;
  const serviceLabel = { police: "police", fire: "fire department", ems: "EMS" }[type];
  const subjectLabel = type === "ems" ? "patient" : "individual";
  const summary = buildPatientSummary(context);

  const prompt = [
    `Generate a calm, professional opening statement for a 911 call spoken by an AI.`,
    summary,
    ``,
    `Rules:`,
    `- Start with: "Hello, I am an AI assistant calling on behalf of a non-English speaking ${subjectLabel}."`,
    `- State the full address clearly.`,
    type === "ems"
      ? `- Include the patient's age and the body areas they reported.`
      : `- Describe the nature of the emergency.`,
    `- End with: "Please send ${serviceLabel} immediately."`,
    `- Keep it under 70 words.`,
    `- Output only the script. No labels, no quotes, no extra text.`,
  ].join("\n");

  const completion = await getClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  });

  const script = completion.choices[0]?.message?.content?.trim();
  if (!script) throw new Error("Groq returned an empty opening script");
  return script;
}

// Generates a response to a dispatcher's question during the live call.
export async function generateResponse(
  context: CallContext,
  dispatcherMessage: string
): Promise<string> {
  const summary = buildPatientSummary(context);

  const systemPrompt = [
    `You are an AI assistant speaking on a live 911 call on behalf of a non-English speaking patient.`,
    `Here is what you know about the patient:`,
    summary,
    ``,
    `Rules:`,
    `- Answer the dispatcher's question directly and briefly.`,
    `- Use only the information you have. If you don't know something, say "I don't have that information."`,
    `- Never break character. Never mention Groq, AI models, or APIs.`,
    `- Keep responses under 40 words.`,
    `- Speak calmly and clearly as if on a real emergency call.`,
  ].join("\n");

  const completion = await getClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: dispatcherMessage },
    ],
    temperature: 0.3,
    max_tokens: 150,
  });

  const response = completion.choices[0]?.message?.content?.trim();
  if (!response) throw new Error("Groq returned an empty response");
  return response;
}
