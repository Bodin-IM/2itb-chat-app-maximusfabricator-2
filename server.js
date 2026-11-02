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

// Må stå før rutene som leser req.body
app.use(express.json());

// Эндпоинт для get запросов на адрес /meldinger
app.get("/meldinger", (req, res) => {
  res.json(meldinger);
});

app.get("/meldinger", (req, res) => {
  const avsender = req.query.avsender;
  if (typeof avsender !== "string" || !avsender.trim()) {
    return res.json(meldinger);
  }
  const utvalg = meldinger.filter(melding =>
    melding.avsender.toLowerCase() ===
    avsender.trim().toLowerCase()
  );
  res.json(utvalg);
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
  app.get("/meldinger/:avsender", (req, res) => {
    const filtrerteMeldinger = meldinger.filter(
      melding => melding.avsender.toLowerCase() === req.params.avsender.toLowerCase()
    );

    if (filtrerteMeldinger.length === 0) {
      return res.status(404).json({
        beskjed: "Fant ikke avsenderen."
      });
    }

    res.json(filtrerteMeldinger);
  });

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
