export const config = {
  runtime: "nodejs",
};

import { createClient } from "@supabase/supabase-js";

// 🧠 Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, user } = req.body;
  const userId = user || "guest";

  if (!message) {
    return res.status(400).json({ reply: "No message received" });
  }

  try {
    // 🟢 Save user message
    await supabase.from("messages").insert([
      {
        user_id: userId,
        role: "user",
        content: message,
      },
    ]);

    // 🟢 Get chat history
    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const formattedMessages = (history || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 🤖 Call Groq AI
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
          messages: formattedMessages,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    console.log("GROQ RESPONSE:", JSON.stringify(data, null, 2));

    // 🔴 Handle Groq errors cleanly
    if (data.error) {
      return res.status(200).json({
        reply: "AI Error: " + data.error.message,
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response from AI";

    // 🟢 Save AI response
    await supabase.from("messages").insert([
      {
        user_id: userId,
        role: "assistant",
        content: reply,
      },
    ]);

    return res.status(200).json({ reply });

  } catch (err) {
    console.log("SERVER ERROR:", err);

    return res.status(500).json({
      reply: "Server error: " + err.message,
    });
  }
}
