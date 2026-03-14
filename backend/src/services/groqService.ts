import Groq from "groq-sdk";

function getClient() {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export interface CallContext {
  type: "police" | "fire" | "ems";
  address: string;
  situation?: string; // plain-language description from frontend (e.g. "Chest pain, not breathing")
  zones?: string[];
  age?: number;
}

// Generates the opening 911 script spoken when the call first connects.
export async function generateOpeningScript(context: CallContext): Promise<string> {
  const { type, address, situation } = context;
  const serviceLabel = { police: "police", fire: "fire department", ems: "EMS" }[type];
  const subjectLabel = type === "ems" ? "patient" : "individual";

  const prompt = [
    `Generate a calm, professional opening statement for a 911 call spoken by an AI assistant.`,
    `Emergency type: ${type}`,
    `Location: ${address}`,
    situation ? `Situation: ${situation}` : "",
    ``,
    `Rules:`,
    `- Start with: "Hello, I am an AI assistant calling on behalf of a non-English speaking ${subjectLabel}."`,
    `- State the full address clearly.`,
    `- Briefly describe the emergency situation.`,
    `- End with: "Please send ${serviceLabel} immediately."`,
    `- Keep it under 70 words.`,
    `- Output only the script. No labels, no quotes, no extra text.`,
  ]
    .filter(Boolean)
    .join("\n");

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
  const { type, address, situation } = context;

  // Build an explicit list of what IS known so the model can't invent facts
  const knownFacts = [
    `- Location: ${address}`,
    `- Emergency type: ${type}`,
    situation ? `- Situation: ${situation}` : "",
  ].filter(Boolean).join("\n");

  const systemPrompt = [
    `You are an AI assistant speaking on a live 911 call on behalf of a non-English speaking person.`,
    ``,
    `THE ONLY INFORMATION YOU HAVE IS:`,
    knownFacts,
    ``,
    `CRITICAL RULES — follow these exactly:`,
    `- If the dispatcher asks for ANYTHING not listed above (name, age, gender, medical history, allergies, insurance, citizenship, etc.), respond with exactly: "I don't have that information."`,
    `- Do NOT guess, infer, or assume any details not explicitly listed above.`,
    `- Do NOT make up a name, age, or gender under any circumstances.`,
    `- Answer only what you know. Keep responses under 30 words.`,
    `- Never mention, Groq, or technology. Speak as if relaying information from the patient.`,
    `- Be calm and direct.`,
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
