import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { embedAndStore } from "./embed.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "RAG API running 🚀" });
});

app.post("/ingest", upload.single("file"), async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string;
  if (!sessionId) { res.status(400).json({ error: "Missing x-session-id header." }); return; }
  if (!req.file)  { res.status(400).json({ error: "No file uploaded." }); return; }

  // Parse PDF from buffer (v2 API)
  const parser = new PDFParse({ data: req.file.buffer });
  const result = await parser.getText();
  const text = result.text?.trim() ?? "";

  if (!text) { res.status(422).json({ error: "PDF has no extractable text." }); return; }

  const { chunkCount } = await embedAndStore(sessionId, text);
  console.log(`✅ ${req.file.originalname} → ${chunkCount} chunks`);

  res.json({ success: true, fileName: req.file.originalname, chunkCount });
});

app.listen(5000, () => console.log("API running on http://localhost:5000"));