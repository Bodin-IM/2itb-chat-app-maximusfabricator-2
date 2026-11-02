import cors from "cors";  // чтобы разрешить браузеру общаться с сервером
import express from "express"; // for å starte server 
import { randomUUID } from "node:crypto";
const app = express(); //создаем само приложение (сервер)
const meldinger = [];

// правила безопасности, разрешаем фронтенду отправлять запросы на сервер
const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://10.100.0.162:5173"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsConfig));
app.use(express.json()); // Må stå før rutene som leser req.body говорит серверу что-бы он использовал json

// 1. GET: Отдает весь список сообщений клиенту когда он делает GET запрос
app.get("/meldinger", (req, res) => {
  res.json(meldinger);
});

// 2. POST: Принимает сообщение от клиента и добавляет его в массив сообщений
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
// Создаем объект сообщения 
  const melding = {
    id: randomUUID(),
    avsender: avsender.trim(),
    tekst: tekst.trim(),
    opprettet: new Date().toISOString()
  };
  
  meldinger.push(melding); // добавляем сообщение в массив сообщений

  console.log("Mottatt:", melding);
  res.status(201).json({
    beskjed: "Meldingen er mottatt!",
    melding: melding
  });
});

app.listen(3000, "0.0.0.0", () => {   // запускаем сервер на порту 3000
  console.log("Serveren kjører på http://localhost:3000");
});
