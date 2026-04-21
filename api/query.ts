// api/query.ts
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PromptTemplate } from "@langchain/core/prompts";

export async function queryRAG(sessionId: string, question: string) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index(process.env.PINECONE_INDEX!);
  

  console.log(process.env.GOOGLE_API_KEY)
  const embeddings = new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-2-preview" });
  const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash-lite", apiKey: process.env.GOOGLE_API_KEY });

  // 1. Embed the question
  const queryEmbedding = await embeddings.embedQuery(question);

  // 2. Query Pinecone namespace
  const queryResponse = await index.namespace(sessionId).query({
    vector: queryEmbedding,
    topK: 3,
    includeMetadata: true,
  });

  const context = queryResponse.matches.map(m => m.metadata?.text).join("\n\n");

  // 3. Generate Answer
  const prompt = PromptTemplate.fromTemplate(`
    Answer the question based only on the following context:
    {context}
    
    Question: {question}
    Answer:
  `);

  const chain = prompt.pipe(model);
  const response = await chain.invoke({ context, question });

  return response.content;
}