export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Invalid request method" });
  }

  const { message, history } = req.body || {};

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
          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",
              content:
                "You are Dfuze AI, a helpful voice assistant. Keep responses short, natural, and easy to speak aloud. Avoid long paragraphs. Be conversational like a real assistant."
            },
            ...(history || []),
            { role: "user", content: message }
          ],

          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    const aiData = await aiRes.json();

    let reply =
      aiData?.choices?.[0]?.message?.content ||
      "No response from AI";

    /* 🧼 CLEAN TEXT FOR VOICE (IMPORTANT FOR ELEVENLABS) */
    reply = reply
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .trim();

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "Error: " + err.message
    });
  }
}
