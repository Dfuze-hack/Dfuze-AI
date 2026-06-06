import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  const { user } = req.query;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user || "guest")
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ messages: data || [] });
}
