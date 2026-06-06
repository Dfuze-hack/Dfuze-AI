import { createClient } from "@supabase/supabase-js";

// 🧠 SUPABASE CLIENT
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
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // 🟢 1. Save user message
    await supabase.from("messages").insert([
      {
        user_id: user || "guest",
        role: "user",
        content: message,
      },
    ]);

    // 🟢 2. Get chat history
    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user || "guest")
      .order("created_at", { ascending: true });

    if (historyError) {
      console.log("History error:", historyError.message);
    }

    // 🟢 3. Format messages for AI
    const formattedMessages = (history || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 🟢 4. Call Groq AI
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
        }),
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    // 🟢 5. Save AI reply
    await supabase.from("messages").insert([
      {
        user_id: user || "guest",
        role: "assistant",
        content: reply,
      },
    ]);

    // 🟢 6. Send response back
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
}
