import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

import { createIcloudEvent } from "./createEnvent";
import { getIcloudEvent } from "./getEvents";

const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(bodyParser.json());

app.post("/api/create-event", async (req, res) => {
  const { summary, description, start, end } = req.body;

  try {
    await createIcloudEvent(summary, description, start, end);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
});

app.get("/api/get-events", async (req, res) => {
  try {
    const events = await getIcloudEvent();

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
});

app.listen(4000, () => console.log("Servidor rodando na porta 4000"));
