export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Invalid request method" });
  }

  const { message, history } = req.body || {};

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
            ...(history || []),
            { role: "user", content: message }
          ]
        })
      }
    );

    const data = await aiRes.json();

    res.status(200).json({
      reply: data?.choices?.[0]?.message?.content || "No response"
    });

  } catch (err) {
    res.status(200).json({ reply: "Error: " + err.message });
  }
}
