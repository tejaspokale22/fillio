import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import matchRoutes from "./routes/matchRoutes.js";

dotenv.config();

const app = express();

// ----- CORS configuration -----
const allowedOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith("chrome-extension://")
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["POST", "GET"],
  }),
);

// ----- Middleware -----
app.use(express.json({ limit: "6mb" }));

// ----- Routes -----
app.use("/api", matchRoutes);

app.get("/", (_req, res) => {
  res.send("Fillio AI API running 🚀");
});

// ----- Server start -----
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Fillio AI server running on port ${PORT}`);
});
