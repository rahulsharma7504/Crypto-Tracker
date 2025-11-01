import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/coingecko", async (req, res) => {
  try {
    const start = Date.now();
    const r = await axios.get("https://api.coingecko.com/api/v3/ping", {
      timeout: 10000,
      headers: { "User-Agent": "CryptoTracker-Debug" },
    });
    const duration = Date.now() - start;
    res.json({ ok: true, status: r.status, data: r.data, duration });
  } catch (err) {
    console.error("Debug coingecko error:", err?.message || err);
    res.status(502).json({ ok: false, message: err?.message || String(err) });
  }
});

export default router;
