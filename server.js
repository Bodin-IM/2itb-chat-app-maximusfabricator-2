import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
const app = express();
const meldinger = [];

const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://10.100.0.162:5173"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsConfig));
app.use(express.json()); // Må stå før rutene som leser req.body

// 1. GET: Отдает весь список сообщений клиенту
app.get("/meldinger", (req, res) => {
  res.json(meldinger);
});


app.post("/meldinger", (req, res) => {
  const avsender = req.body?.avsender;
  const tekst = req.body?.tekst;
  // En enkel kontroll før vi legger til meldingen
  if (typeof avsender !== "string" ||
    typeof tekst !== "string" ||
    !avsender.trim() || !tekst.trim()) {
  return res.status(400).json({
      beskjed: "Avsender og tekst må fylles ut."
    });
  }

  const melding = {
    id: randomUUID(),
    avsender: avsender.trim(),
    tekst: tekst.trim(),
    opprettet: new Date().toISOString()
  };
  
  meldinger.push(melding);
  console.log("Mottatt:", melding);
  res.status(201).json({
    beskjed: "Meldingen er mottatt!",
    melding: melding
  });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Serveren kjører på http://localhost:3000");
});
