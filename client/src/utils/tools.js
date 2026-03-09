export const normalize = (str) =>
  (str || "").toLowerCase().trim().replace(/\s+/g, " ");

export const showStatus = (setter, message, duration = 1600) => {
  setter(message);
  setTimeout(() => setter(""), duration);
};
