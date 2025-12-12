// public/background.js

const HARD_KEY = "";
const CACHE = new Map();

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

function promptFor(label, candidates) {
  return `
You map a form label to one of the allowed keys.
Please give very accurate answers.

Allowed keys: ${JSON.stringify(candidates)}

Return ONLY valid JSON like:
{"key":"email"}   // if matched
{"key":null}      // if no match

Label: ${JSON.stringify(label)}
`;
}

async function callAI(prompt, key) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + key,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 50,
    }),
  });
  return await r.text();
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {}
  const m = str.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    return null;
  }
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action !== "MAP_LABEL") return false;

  const { label, candidates } = req;
  const key = norm(label);
  if (CACHE.has(key)) {
    sendResponse({ ok: true, key: CACHE.get(key) });
    return true;
  }

  chrome.storage.sync.get(["openaiApiKey"], async (res) => {
    const apiKey = res.openaiApiKey || HARD_KEY;
    if (!apiKey) {
      sendResponse({ ok: false, error: "missing_api_key" });
      return;
    }

    try {
      const p = promptFor(label, candidates);
      const raw = await callAI(p, apiKey);
      const parsed = parseJSON(raw);

      const match = parsed && "key" in parsed ? parsed.key : null;
      CACHE.set(key, match);

      sendResponse({ ok: true, key: match });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  });

  return true;
});
