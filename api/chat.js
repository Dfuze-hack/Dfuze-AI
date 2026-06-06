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

  if (!message) {
    return res.status(400).json({ error: "No message" });
  }

  try {
    /* 1. CALL GROQ AI */
    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DfuzeAI}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content || "No response";

    /* 2. SAVE TO SUPABASE */
    await supabase.from("messages").insert([
      {
        user_id: user || "guest",
        role: "user",
        content: message
      },
      {
        user_id: user || "guest",
        role: "assistant",
        content: reply
      }
    ]);

    /* 3. RETURN RESPONSE */
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
