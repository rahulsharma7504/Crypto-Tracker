import express from "express";
import { getCoins, saveHistory, getCoinHistory } from "../controllers/coinController.js";


const router = express.Router();

router.get("/", getCoins);
router.post("/history", saveHistory);
router.get("/history/:coinId", getCoinHistory);

export default router;




