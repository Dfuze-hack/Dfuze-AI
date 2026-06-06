export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Invalid request method" });
  }

  const { message } = req.body || {};

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
            { role: "user", content: message }
          ]
        })
      }
    );

    const aiData = await aiRes.json();

    const reply =
      aiData?.choices?.[0]?.message?.content ||
      "No response from AI";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "Error: " + err.message
    });
  }
}
