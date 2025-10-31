import mongoose from "mongoose";

const currentDataSchema = new mongoose.Schema({
  coinId: { type: String, unique: true },
  name: String,
  symbol: String,
  image: String,
  price: Number,
  marketCap: Number,
  change24h: Number,
  high24h: Number,
  low24h: Number,
  totalVolume: Number,
  circulatingSupply: Number,
  lastUpdated: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("CurrentData", currentDataSchema);
