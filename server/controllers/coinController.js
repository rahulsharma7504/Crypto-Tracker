import axios from "axios";
import NodeCache from "node-cache";
import HistoryData from "../models/HistoryData.js";
import CurrentData from "../models/CurrentData.js";

// 1️⃣ Cache instance (data 60 seconds ke liye store hoga)
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
  
// 2️⃣ Fetch & cache live coins 
export const getCoins = async (req, res) => {
  try {
    // check cache first
    const cachedData = cache.get("coins");
    if (cachedData) {
      console.log("✅ Serving from cache");
      return res.json({
        message: "Fetched from cache successfully",
        count: cachedData.length,
        data: cachedData,
      });
    }

    // fetch from CoinGecko
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
        },
        timeout: 10000, // safety timeout
      }
    );

    // save to DB
    for (const coin of data) {
      await CurrentData.findOneAndUpdate(
        { coinId: coin.id },
        {
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          price: coin.current_price,
          marketCap: coin.market_cap,
          change24h: coin.price_change_percentage_24h,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          totalVolume: coin.total_volume,
          circulatingSupply: coin.circulating_supply,
          lastUpdated: coin.last_updated,
          timestamp: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // store API data in cache
    cache.set("coins", data);
    console.log("⚡ Live data fetched and cached");

    res.json({
      message: "Fetched from CoinGecko successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("❌ getCoins error:", error.message);

    // fallback: try to return from DB if API failed
    const dbData = await CurrentData.find().limit(10);
    if (dbData.length > 0) {
      return res.status(200).json({
        message: "Fetched from local DB (fallback mode)",
        count: dbData.length,
        data: dbData,
      });
    }

    res.status(500).json({
      message: "Failed to fetch live coins data",
      error: error.message,
    });
  }
};

// 3️⃣ Save historical records (for trends)
export const saveHistory = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
        },
      }
    );

    const records = data.map((coin) => ({
      coinId: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      marketCap: coin.market_cap,
      change24h: coin.price_change_percentage_24h,
    }));

    await HistoryData.insertMany(records);
    res.json({
      message: "History saved successfully",
      count: records.length,
    });
  } catch (err) {
    console.error("saveHistory error:", err);
    res.status(500).json({
      message: "Error saving history",
      error: err.message,
    });
  }
};

// 4️⃣ Get historical coin data
export const getCoinHistory = async (req, res) => {
  try {
    const { coinId } = req.params;
    const history = await HistoryData.find({ coinId }).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    console.error("getCoinHistory error:", err);
    res.status(500).json({
      message: "Error fetching coin history",
      error: err.message,
    });
  }
};
