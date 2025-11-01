import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import { startCronJob } from "./utils/cronJob.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Testing Work"))
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/coins", coinRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCronJob()
})
