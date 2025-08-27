import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const app = express();
app.use(express.json());

// Load API key from environment
const API_KEY = process.env.API_KEY || "preetbiswas";

// Middleware to check API key
app.use((req, res, next) => {
  const key = req.headers["authorization"];
  if (!key || key !== `Bearer ${API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Model setup
const MODEL_DIR = path.join(process.cwd(), "models");
const MODEL_FILE = "Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf";
const MODEL_PATH = path.join(MODEL_DIR, MODEL_FILE);

// Hugging Face download URL
const MODEL_URL = "https://huggingface.co/preetbiswas121106/qwen-lupin/resolve/main/Qwen2.5-Coder-3B-Instruct-Q4_K_M.gguf";

// Download if missing
if (!fs.existsSync(MODEL_PATH)) {
  console.log("Model not found, downloading from Hugging Face...");
  fs.mkdirSync(MODEL_DIR, { recursive: true });

  try {
    execSync(`curl -L -o "${MODEL_PATH}" "${MODEL_URL}"`, { stdio: "inherit" });
    console.log("Model downloaded successfully.");
  } catch (err) {
    console.error("Failed to download model:", err.message);
  }
}

// Chat completion endpoint
app.post("/v1/chat/completions", (req, res) => {
  const prompt = req.body.prompt || "Hello";

  exec(
    `./main -m "${MODEL_PATH}" -p "${prompt}"`,
    (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: stderr || err.message });
      }

      res.json({
        id: "chatcmpl-" + Date.now(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        choices: [
          {
            message: { role: "assistant", content: stdout.trim() },
          },
        ],
      });
    }
  );
});

// Server start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
