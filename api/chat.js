import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Invalid request method" });
  }

  const { message, user } = req.body || {};

  if (!message) {
    return res.status(200).json({ reply: "No message received" });
  }

  try {
    // 🔥 UPDATED GROQ MODEL (FIX)
    const aiRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DfuzeAI}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // ✅ FIXED MODEL
          messages: [
            { role: "user", content: message }
          ],
          temperature: 0.7
        })
      }
    );

    const aiData = await aiRes.json();

    console.log("GROQ RESPONSE:", aiData);

    const reply =
      aiData?.choices?.[0]?.message?.content ||
      aiData?.error?.message ||
      "No response from AI";

    // 💾 Save to Supabase (safe)
    try {
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
    } catch (e) {
      console.log("DB error:", e.message);
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.log("SERVER ERROR:", err);

    return res.status(200).json({
      reply: "Backend error: " + err.message
    });
  }
}
