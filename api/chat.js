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

console.log("GROQ RAW RESPONSE:", data);

// 🔥 SAFE ERROR HANDLING
const reply =
  data?.choices?.[0]?.message?.content ||
  data?.error?.message ||
  "AI failed to respond (check API key or model)";
