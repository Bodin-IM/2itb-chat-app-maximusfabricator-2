import cors from "cors";  // чтобы разрешить браузеру общаться с сервером
import express from "express"; // for å starte server 
import { randomUUID } from "node:crypto";
import { existsSync, readFile, readFileSync, writeFile, writeFileSync } from "node:fs"
import session from "express-session";
import { randomBytes } from "node:crypto";

const app = express(); //создаем само приложение (сервер)

const meldingerFil = "./meldinger.json";
if (!existsSync(meldingerFil)) {
  writeFileSync(meldingerFil, "[]", "utf8")
}
let meldinger = JSON.parse(readFileSync(meldingerFil, "utf8"));

function lagreMeldinger() {
  writeFileSync(meldingerFil, JSON.stringify(meldinger,null,2), "utf8")  
}

// правила безопасности, разрешаем фронтенду отправлять запросы на сервер
const corsConfig = {
  origin: [
    "http://localhost:5173",
    "http://10.100.0.162:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
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

// const requireLogin = (req,res,next) => {
//   if (!req.session.bruker) {
//     return res.status(401).json({feil: "Du må logge in"})
//   }
// }

function tekstFeil(tekst, tekstMaks=500) {
  if (typeof tekst !=="string") return "Tekst må være en string"
  if (!tekst.trim()) return "Tekst må fylles ut"
  if (tekst.length > tekstMaks) return "Bruk maks 500 tegn."
  return "";
}

const brukereFil = "./brukere.json";
if (!existsSync(brukereFil)) {
  writeFileSync(brukereFil, "[]", "utf8")
}
let brukere = JSON.parse(readFileSync(brukereFil, "utf8"));

function lagreNyBruker() {
  writeFileSync(brukereFil, JSON.stringify(brukere,null,2), "utf8")  
}

app.post("/brukere", (req,res) => {
  const brukernavn = req.body?.regBrukernavn
  const passord = req.body?.regPassord

  const bruker = {
    id: randomUUID(),
    brukernavn: brukernavn.trim(),
    passord: passord.trim()
  };

  brukere.push(bruker); // добавляем сообщение в массив сообщений
  lagreNyBruker();

  console.log("Registrert ny bruker:", bruker);
  res.status(201).json({
    beskjed: "Bruker er mottatt!",
    bruker: bruker
  });
});

app.post("/login", (req, res, next) => {
  const brukernavn = req.body?.loginBrukernavn;
  const passord = req.body?.loginPassord;

  const bruker = brukere.find(b => b.brukernavn === brukernavn && b.passord === passord);
  
  if (!bruker) {
    return res.status(401).json({ feil: "Feil navn og passord" });
  }

  req.session.regenerate(feil => {
    if (feil) return next(feil);
    req.session.bruker = bruker.brukernavn;
    res.json({ bruker: bruker.brukernavn });
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
  const avsender = brukere.find(b => b.brukernavn === req.session.bruker)?.navn;
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

app.patch("/meldinger/:id", (req,res, next) => {
  const melding = meldinger.find(m => m.id === req.params.id);
  if (!melding){
    return res.status(404).json({ beskjed: "Fant ikke meldingen" });
  }
  const tekst = req.body?.tekst;
  if (typeof tekst !== "string" || !tekst.trim()) {
    return res.status(400).json({beskjed: "Skriv en melding"});
  }
  const endret = { ...melding, tekst: tekst.trim()} ;
  const nyListe = meldinger.map(m =>
    m.id === req.params.id ? endret : m
  );
  try {
    lagreMeldinger()
    meldinger = nyListe;
    res.json({ beskjed: "Meldingen er endret.", melding:endret});

  } catch (feil) {
    console.error(feil);
    res.status(500).json({ beskjed: "Kunne ikke lagre"})
  }
})

app.delete("/meldinger/:id", (req, res) => {
 const finnes = meldinger.some(m => m.id === req.params.id);
 if (!finnes) {
 return res.status(404).json({ beskjed: "Fant ikke meldingen." });
 }
 const nyListe = meldinger.filter(m => m.id !== req.params.id);
 try {
 lagreMeldinger()
 meldinger = nyListe;
 res.json({ beskjed: "Meldingen er slettet." });
 } catch (feil) {
 console.error(feil);
 res.status(500).json({ beskjed: "Kunne ikke lagre." });
 }
});

app.listen(3000, "0.0.0.0", () => {   // запускаем сервер на порту 3000
  console.log("Serveren kjører på http://localhost:3000");
});
