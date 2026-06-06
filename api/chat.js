export default async function handler(req, res) {
  console.log("API HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    console.log("MESSAGE:", message);

    return res.status(200).json({
      reply: "Backend is working ✅ but Groq is not connected yet"
    });

  } catch (err) {
    console.log("ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
