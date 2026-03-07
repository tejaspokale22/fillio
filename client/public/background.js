const CACHE_KEY = "fillio_label_cache";

// load cache from storage
async function loadCache() {
  const result = await chrome.storage.local.get(CACHE_KEY);
  return result[CACHE_KEY] || {};
}

// save cache
async function saveCache(cache) {
  await chrome.storage.local.set({ [CACHE_KEY]: cache });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "MATCH_LABELS") return;

  async function handleRequest() {
    try {
      const { profileKeys, formLabels } = message;

      const cache = await loadCache();

      const mapping = {};
      const unknownLabels = [];

      // check cache first
      for (const label of formLabels) {
        if (cache[label] !== undefined) {
          mapping[label] = cache[label];
        } else {
          unknownLabels.push(label);
        }
      }

      // call AI only for labels not in cache
      if (unknownLabels.length > 0) {
        const res = await fetch("https://fillio-server.vercel.app/api/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profileKeys,
            formLabels: unknownLabels,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        if (!data || typeof data !== "object") {
          throw new Error("Invalid response from backend");
        }

        const aiMapping = data.mapping || {};

        for (const label of unknownLabels) {
          const key = aiMapping[label] ?? null;

          mapping[label] = key;

          // update cache
          cache[label] = key;
        }

        // save updated cache
        await saveCache(cache);
      }

      sendResponse({ mapping });
    } catch (error) {
      console.error("Fillio AI request failed:", error);

      sendResponse({ mapping: {} });
    }
  }

  handleRequest();

  return true; // keep async message channel open
});
