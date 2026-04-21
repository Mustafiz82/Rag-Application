import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { embedAndStore } from "./embed.js";
import { answerWithRagPolicy, streamAnswerWithRagPolicy } from "./query.js";

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



app.get("/ask", async (req, res) => {

  console.log("hit")
  const sessionId = req.headers["x-session-id"] as string;
  const question  = req.query.p;
  const allowOutsideKnowledge =
    req.headers["x-allow-outside-knowledge"] === "1" ||
    req.headers["x-allow-outside-knowledge"] === "true";
  const stream = req.query.stream === "1" || String(req.headers.accept ?? "").includes("text/event-stream");

  if (!sessionId || !question) {
    res.status(400).json({ error: "Missing session ID or question" });
    return;
  }



  try {
    if (!stream) {
      const result = await answerWithRagPolicy({
        sessionId,
        message: String(question),
        allowOutsideKnowledge: Boolean(allowOutsideKnowledge),
      });
      res.json(result);
      return;
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const writeEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // #region agent log
    fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H1',location:'api/index.ts:/ask_sse_start',message:'SSE /ask started',data:{sessionIdPresent:!!sessionId,allowOutsideKnowledge,questionPreview:String(question).slice(0,120)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    writeEvent("status", { step: "start" });

    for await (const ev of streamAnswerWithRagPolicy({
      sessionId,
      message: String(question),
      allowOutsideKnowledge: Boolean(allowOutsideKnowledge),
    })) {
      if (ev.type === "token") writeEvent("token", { token: ev.token });
      else if (ev.type === "status") writeEvent("status", ev);
      else if (ev.type === "final") writeEvent("final", ev.data);
      else if (ev.type === "error") writeEvent("error", ev);
    }

    // #region agent log
    fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H4',location:'api/index.ts:/ask_sse_end',message:'SSE /ask ended',data:{sessionIdPresent:!!sessionId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

    res.end();
  } catch (error) {
    console.error(error);
    // #region agent log
    fetch('http://127.0.0.1:7852/ingest/6088718b-12d7-4111-bc12-bee6f4d74c4c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'51b965'},body:JSON.stringify({sessionId:'51b965',runId:'pre-fix',hypothesisId:'H5',location:'api/index.ts:/ask_catch',message:'SSE /ask threw error',data:{errMessage:String((error as any)?.message ?? '').slice(0,200)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

app.listen(5000, () => console.log("API running on http://localhost:5000"));