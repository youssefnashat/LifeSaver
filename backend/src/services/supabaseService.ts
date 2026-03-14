import { createClient } from "@supabase/supabase-js";
import type { CallContext } from "./groqService";

// Supabase is used only to store call context so /api/respond can look up
// patient details (type, address, zones, age) using the contextId.
//
// Required table — run this in your Supabase SQL editor:
//
//   CREATE TABLE emergency_calls (
//     id UUID PRIMARY KEY,
//     type TEXT NOT NULL,
//     address TEXT NOT NULL,
//     zones TEXT[],
//     age INTEGER,
//     created_at TIMESTAMPTZ DEFAULT NOW()
//   );

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  return createClient(url, key);
}

export async function storeCallContext(
  contextId: string,
  context: CallContext
): Promise<void> {
  const { error } = await getClient()
    .from("emergency_calls")
    .insert({
      id: contextId,
      type: context.type,
      address: context.address,
      zones: context.zones ?? [],
      age: context.age ?? null,
    });

  if (error) throw new Error(`Failed to store call context: ${error.message}`);
}

export async function getCallContext(contextId: string): Promise<CallContext> {
  const { data, error } = await getClient()
    .from("emergency_calls")
    .select("type, address, zones, age")
    .eq("id", contextId)
    .single();

  if (error || !data) throw new Error(`Call context not found for id: ${contextId}`);

  return {
    type: data.type,
    address: data.address,
    zones: data.zones ?? [],
    age: data.age ?? undefined,
  };
}
