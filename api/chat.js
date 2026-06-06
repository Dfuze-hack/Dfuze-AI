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
    return res.status(400).json({ reply: "No message received" });
  }

  const userId = user || "guest";

  try {
    // 🟢 SAVE USER MESSAGE
    const { error: insertError } = await supabase
      .from("messages")
      .insert([
        {
          user_id: userId,
          role: "user",
          content: message,
        },
      ]);

    if (insertError) {
      console.log("Insert error:", insertError);
    }

    // 🟢 GET HISTORY
    const { data: history, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.log("Fetch error:", fetchError);
    }

    const formattedMessages = (history || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 🟢 CALL GROQ
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
      data?.error?.message ||
      "No response";

    // 🟢 SAVE AI RESPONSE
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
