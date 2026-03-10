import groq from "../ai/groqClient.js";

function sanitizeJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    // remove markdown wrappers if model returns ```json
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned invalid JSON");
    }
  }
}

export async function matchLabels(profileKeys, formLabels) {
  const systemPrompt = `
You are a deterministic form field matching engine.

Your task is to match Google Form labels with user profile keys.

INPUTS
You will receive:
1. Profile Keys → fields available in the user's profile
2. Form Labels → labels extracted from a Google Form

MATCHING PROCESS
For each form label:
1. Understand the meaning of the label.
2. Compare it with the provided profile keys.
3. Select the most semantically similar profile key.

STRICT RULES
- Only use keys from the provided profile keys list.
- Never invent, modify, or create new keys.
- If no suitable match exists, return null.
- If the meaning is ambiguous or uncertain, return null.
- Every form label must appear in the output.
- Please do very intelligent matching with 100% accuracy. Do not return incorrect matches.

OUTPUT FORMAT
Return STRICT JSON only.

Format:
{
 "label": "profile_key" | null
}

Do not include explanations.
Do not include markdown.
Return JSON only.
`;

  const userPrompt = `
Profile Keys:
${profileKeys.join(", ")}

Form Labels:
${formLabels.join("\n")}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0].message.content.trim();

    const parsed = sanitizeJSON(raw);

    const validatedMapping = {};

    for (const label of formLabels) {
      const value = parsed[label];

      if (value === null) {
        validatedMapping[label] = null;
      } else if (typeof value === "string" && profileKeys.includes(value)) {
        validatedMapping[label] = value;
      } else {
        validatedMapping[label] = null;
      }
    }

    return validatedMapping;
  } catch (error) {
    console.error("Label matching failed:", error);

    const fallback = {};
    formLabels.forEach((label) => (fallback[label] = null));

    return fallback;
  }
}
