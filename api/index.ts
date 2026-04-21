import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "RAG API running 🚀" });
});

app.listen(5000, () => {
  console.log("API running on http://localhost:5000");
});