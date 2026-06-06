import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, user } = req.body;

  console.log("ENV CHECK:", {
    supabase: !!process.env.SUPABASE_URL,
    key: !!process.env.SUPABASE_KEY,
    groq: !!process.env.DfuzeAI,
  });

  try {
    // 🧠 test Groq request first (no Supabase yet)
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DfuzeAI}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "user", content: message }
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("🔥 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      return res.status(200).json({
        reply: "GROQ ERROR: " + (data.error?.message || "Unknown error"),
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    return res.status(200).json({ reply });

  } catch (err) {
    console.log("SERVER CRASH:", err);

    return res.status(500).json({
      reply: "SERVER ERROR: " + err.message,
    });
  }
}
