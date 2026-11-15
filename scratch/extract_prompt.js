const fs = require("fs");
const path = require("path");

const transcriptPath = "C:/Users/reddy/.gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/.system_generated/logs/transcript.jsonl";
const lines = fs.readFileSync(transcriptPath, "utf8").split("\n");

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i].trim()) continue;
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.type === "USER_INPUT") {
      console.log("Found user prompt at step_index " + obj.step_index);
      fs.writeFileSync("C:/Users/reddy/.gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/scratch/last_user_prompt.md", obj.content);
      console.log("Wrote last user prompt to scratch/last_user_prompt.md (length: " + obj.content.length + ")");
      break;
    }
  } catch (e) {}
}
