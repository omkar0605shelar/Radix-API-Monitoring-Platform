import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: process.env.NVIDIA_BASE_URL,
});

async function main() {
  const prompt = `
You are a senior backend security engineer.

Analyze the following API endpoint code and identify issues.

Focus on:
- Authentication & authorization
- Input validation
- Performance issues
- Security vulnerabilities
- Best practices

Return STRICT JSON only (no explanation outside JSON):

{
  "endpoint": "",
  "issues": [],
  "suggestions": [],
  "security_score": 0
}

Rules:
- security_score must be between 0 to 10
- Keep issues and suggestions short and precise

API Code:
Method: POST
Path: /api/auth/login
Request: {"email":"string","password":"string"}
Response: {"token":"string","user":{"id":"string"}}
`;

  const response = await nvidia.chat.completions.create({
    model: "meta/llama-3.3-70b-instruct",
    messages: [{ role: "system", content: "You are a professional assistant. Follow instructions strictly." }, { role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  console.log(response.choices[0]?.message?.content);
}

main();
