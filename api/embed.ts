import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

export async function embedAndStore(sessionId: string, text: string) {



  // Initialized here so dotenv has already run
  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "gemini-embedding-001",
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
    .index(process.env.PINECONE_INDEX!);

  const docs = await splitter.createDocuments([text], [{ sessionId }]);
  const vectors = await embeddings.embedDocuments(docs.map(d => d.pageContent));

  const records = docs.map((doc, i) => ({
    id: `${sessionId}-${i}`,
    values: vectors[i],
    metadata: { sessionId, text: doc.pageContent } as Record<string, string>,
  }));

  for (let i = 0; i < records.length; i += 100) {
    await index.namespace(sessionId).upsert({ records: records.slice(i, i + 100) });
  }

  return { chunkCount: docs.length };
}