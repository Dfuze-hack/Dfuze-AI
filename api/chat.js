import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ============================
// 🧠 AI CHAT ENDPOINT
// ============================
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Dfuze AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Dfuze AI. You are smart, friendly, and respond briefly unless asked for details. You support voice mode (Sol voice system)."
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    res.json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err.message);
    res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
});

// ============================
// 🎤 VOICE CONFIG ENDPOINT
// (Frontend can fetch available voices)
// ============================
app.get("/voices", (req, res) => {
  res.json({
    voices: [
      { id: "sol", name: "Sol 🌞", style: "warm female" },
      { id: "nova", name: "Nova ✨", style: "soft female" },
      { id: "alex", name: "Alex 🤖", style: "male neutral" }
    ]
  });
});

// ============================
// ❤️ HEALTH CHECK
// ============================
app.get("/", (req, res) => {
  res.json({
    status: "Dfuze AI Server Running 🚀",
    voiceMode: true,
    chat: "/chat",
    voices: "/voices"
  });
});

// ============================
// 🚀 START SERVER
// ============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Dfuze AI running on http://localhost:${PORT}`);
});
