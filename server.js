import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// -------------------- CONFIG --------------------
const app = express();
app.use(express.json());

// API key for auth (set in Render environment)
const API_KEY = process.env.API_KEY || "preetbiswas";

// Local model setup
const MODEL_DIR = path.join(process.cwd(), "models");
const MODEL_FILE = "Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf";
const MODEL_PATH = path.join(MODEL_DIR, MODEL_FILE);

// Hugging Face repo (your uploaded model)
const MODEL_URL =
  "https://huggingface.co/preetbiswas121106/qwen-lupin/resolve/main/Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf";

// -------------------- MIDDLEWARE --------------------
app.use((req, res, next) => {
  const key = req.headers["authorization"];
  if (!key || key !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized: invalid API key" });
  }
  next();
});

// -------------------- MODEL PREP --------------------
if (!fs.existsSync(MODEL_PATH)) {
  console.log("Model not found locally. Downloading from Hugging Face...");
  fs.mkdirSync(MODEL_DIR, { recursive: true });

  try {
    execSync(`curl -L -o "${MODEL_PATH}" "${MODEL_URL}"`, { stdio: "inherit" });
    console.log("✅ Model downloaded successfully.");
  } catch (err) {
    console.error("❌ Failed to download model:", err.message);
  }
}

// -------------------- ENDPOINTS --------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Lupin API Server running 🚀" });
});

app.post("/v1/chat/completions", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing 'prompt' in request body" });
  }

  // Run llama-cli with the prompt
  exec(`./llama.cpp/build/bin/llama-cli -m "${MODEL_PATH}" -p "${prompt}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("Error running llama-cli:", stderr || err.message);
      return res.status(500).json({ error: "Model execution failed" });
    }

    res.json({
      id: "chatcmpl-" + Date.now(),
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: MODEL_FILE,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: stdout.trim() },
          finish_reason: "stop",
        },
      ],
    });
  });
});

// -------------------- SERVER START --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Lupin API Server running on port ${PORT}`);
});
