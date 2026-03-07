import express from "express";
import { matchLabels } from "../services/labelMatcher.js";

const router = express.Router();

router.post("/match", async (req, res) => {
  try {
    // console.log("api hit");
    const { profileKeys, formLabels } = req.body;
    // console.log(profileKeys, formLabels);

    if (!profileKeys || !formLabels) {
      return res.status(400).json({
        error: "profileKeys and formLabels required",
      });
    }

    const mapping = await matchLabels(profileKeys, formLabels);
    // console.log(mapping);

    res.json({ mapping });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "AI matching failed",
    });
  }
});

export default router;
