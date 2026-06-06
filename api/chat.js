import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Invalid method" });
  }

  const { message, user } = req.body || {};

  if (!message) {
    return res.status(200).json({ reply: "No message received" });
  }

  try {
    const aiRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DfuzeAI}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: message }]
        })
      }
    );

    const aiData = await aiRes.json();

    console.log("GROQ RAW:", aiData);

    const reply =
      aiData?.choices?.[0]?.message?.content ??
      aiData?.error?.message ??
      "AI returned empty response";

    // SAVE (safe, no crash if fails)
    try {
      await supabase.from("messages").insert([
        { user_id: user || "guest", role: "user", content: message },
        { user_id: user || "guest", role: "assistant", content: reply }
      ]);
    } catch (e) {
      console.log("SUPABASE SAVE ERROR:", e.message);
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.log("FATAL ERROR:", err);

    return res.status(200).json({
      reply: "Backend error: " + err.message
    });
  }
}
