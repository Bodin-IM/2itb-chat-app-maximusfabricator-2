import cors from "cors";  // чтобы разрешить браузеру общаться с сервером
import express from "express"; // for å starte server 
import { randomUUID } from "node:crypto";
import { existsSync, readFile, readFileSync, writeFile, writeFileSync } from "node:fs"
import session from "express-session";
import { randomBytes } from "node:crypto";

const app = express(); //создаем само приложение (сервер)

const fil = "./meldinger.json";
if (!existsSync(fil)) {
  writeFileSync(fil, "[]", "utf8")
}
let meldinger = JSON.parse(readFileSync(fil, "utf8"));

function lagreMeldinger() {
  writeFileSync(fil, JSON.stringify(meldinger,null,2), "utf8")  
}

// правила безопасности, разрешаем фронтенду отправлять запросы на сервер
const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://10.100.0.162:5173"
  ],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsConfig)); // разрешаем браузеру общаться с сервером
app.use(express.json()); // Må stå før rutene som leser req.body говорит серверу что-бы он использовал json

app.use(session({
  secret: randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {httpOnly: true, sameSite: "lax", secure: false}
}));

const requireLogin = (req,res,next) => {
  if (!req.session.bruker) {
    return res.status(401).json({feil: "Du må logge in"})
  }
}

const brukere = [
  { navn: "sara", passord: "test123" },
  { navn: "ali", passord: "test123"}
];

function tekstFeil(tekst, avsender, tekstMaks=500, avsenderMaks = 40) {
  if (typeof tekst !=="string") return "Tekst må være en string"
  if (!tekst.trim()) return "Tekst må fylles ut"
  if (!tekst.length > tekstMaks) return "Bruk maks 500 tegn."
  if (!avsender.trim().length > avsenderMaks) return "Bruk maks 40 tegn for brukernavn"
  return "";
}


app.post("/login", (req,res, next) => {
  const bruker = brukere.find(b =>
    b.navn === req.body.brukernavn && b.passord === req.body.passord);
  if (!bruker) {
    return res.status(401).json({ feil: "Feil navn og passord" });
  }
  req.session.regenerate(feil => {
    if (feil) return next(feil);
    req.session.bruker = bruker.navn;
    res.json({ bruker: bruker.navn });
  });
});

app.use("/meldinger", (req,res, next) => {
  if (!req.session.bruker) {
    return res.status(401).json({ feil: "Du må logge inn" });
  }
  next();
});
  app.post("/logout", (req,res, next) => {
    req.session.destroy(feil => {
      if (feil) return next(feil);
      res.clearCookie("connect.sid");
      res.json({ melding: "Logget ut" });
    });
  });

// 1. GET: Отдает весь список сообщений клиенту когда он делает GET запрос
app.get("/meldinger", (req, res) => {
  res.json(meldinger);
});

// 2. POST: Принимает сообщение от клиента и добавляет его в массив сообщений
app.post("/meldinger", (req, res, next) => {
  const avsender = brukere.find(b => b.navn === req.session.bruker)?.navn;
  const tekst = req.body?.tekst;
  const feil = tekstFeil(tekst)
  
  if (feil) {return res.status(400).json({beskjed: feil });
  }
// Создаем объект сообщения 
  const melding = {
    id: randomUUID(),
    avsender: avsender.trim(),
    tekst: tekst.trim(),
    opprettet: new Date().toISOString()
  };
  
  meldinger.push(melding); // добавляем сообщение в массив сообщений
  lagreMeldinger();

  console.log("Mottatt:", melding);
  res.status(201).json({
    beskjed: "Meldingen er mottatt!",
    melding: melding
  });
});

app.listen(3000, "0.0.0.0", () => {   // запускаем сервер на порту 3000
  console.log("Serveren kjører på http://localhost:3000");
});
