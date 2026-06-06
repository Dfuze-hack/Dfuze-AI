export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const message = req.body.message;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-site.vercel.app",
        "X-Title": "Dfuze AI"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages: [
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // 🔥 IMPORTANT FIX (prevents undefined)
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "No response from AI";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      reply: "Server error",
      error: err.message
    });
  }
}
