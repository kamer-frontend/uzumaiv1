import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

app.post("/api/generate", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Xabar bo'sh bo'lishi mumkin emas" });
  }

  // AI promptini yangiladik – mijoz izohlarini chiqarishni olib tashladik
  const prompt = `
Sen Uzum marketplace uchun professional copywriter va SEO mutaxassisisan.
Foydalanuvchi senga mahsulot haqida erkin ma'lumot beradi. Sen shu ma'lumotlardan foydalanib quyidagi formatda javob qaytar:

[TITLE] – Sotuvni oshiradigan qisqa va mazmunli tovar nomi
[FEATURES] – 5 ta asosiy afzallik (har biri yangi qatordan)
[DESCRIPTION] – To'liq, SEO optimizatsiyalangan va sotuvga yo'naltirilgan tavsif

Foydalanuvchi xabari: "${message}"
Til: O'zbek
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0].message?.content) {
      return res.status(500).json({ error: "AI dan noto'g'ri javob keldi" });
    }

    const text = data.choices[0].message.content;

    // Javobni [TITLE], [FEATURES], [DESCRIPTION] bo'yicha ajratish
    const getTagContent = (tag, nextTag) => {
      const parts = text.split(tag);
      if (parts.length < 2) return "";
      return parts[1].split(nextTag || "\n")[0].trim();
    };

    res.json({
      title: getTagContent("[TITLE]", "[FEATURES]"),
      features: getTagContent("[FEATURES]", "[DESCRIPTION]"),
      description: getTagContent("[DESCRIPTION]"),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI xatolik berdi" });
  }
});

app.listen(3000, () =>
  console.log("🚀 Server http://localhost:3000 da ishga tushdi")
);
