import axios from "axios";
import HistoryData from "../models/HistoryData.js";


import CurrentData from "../models/CurrentData.js";

// Existing getCoins function
export const getCoins = async (req, res) => {
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
        headers: {
          "User-Agent": "Mozilla/5.0 (Node Server; CryptoTrackerApp)", // prevents 403/429
          "Accept-Encoding": "gzip,deflate,compress", // speeds up data transfer
        },
        timeout: 10000, // 10 sec timeout
      }
    );

    // Save or overwrite Current Data
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

    res.json({
      message: "Live data fetched & current DB updated successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    // 🔁 Backup Fallback API (mirror)
    try {
      const backup = await axios.get(
        "https://api.coingecko.net/api/v3/coins/markets",
        {
          params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: 10,
            page: 1,
          },
          headers: { "User-Agent": "Mozilla/5.0" },
        }
      );

      res.json({
        message: "Fetched from backup API ✅",
        count: backup.data.length,
        data: backup.data,
      });
    } catch (fallbackError) {
      console.error("Backup API failed:", fallbackError.message);
      res.status(500).json({
        message: "Both CoinGecko APIs failed. Please try again later.",
        error: fallbackError.message,
      });
    }

    console.error("getCoins error:", error);
    res.status(500).json({
      message: "Failed to fetch live coins data",
      error: error.message,
    });
  }
};





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
    res.json({ message: "History saved successfully", count: records.length });
  } catch (err) {
    console.error("saveHistory error:", err);
    res.status(500).json({ message: "Error saving history", error: err.message });
  }
};



export const getCoinHistory = async (req, res) => {
  try {
    const { coinId } = req.params;
    const history = await HistoryData.find({ coinId }).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    console.error("getCoinHistory error:", err);
    res.status(500).json({ message: "Error fetching coin history", error: err.message });
  }
};
