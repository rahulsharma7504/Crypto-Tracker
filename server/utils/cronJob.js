import cron from "node-cron";
import axios from "axios";
import CurrentData from "../models/CurrentData.js";
import HistoryData from "../models/HistoryData.js";

// Cron Job: Runs every hour
export const startCronJob = () => {
  console.log("⏳ Cron job initialized...");

  // Every 1 hour (at minute 0)
  cron.schedule("0 * * * *", async () => {
    console.log(" Cron Job Running: Fetching latest crypto data...");
    
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

      const currentTime = new Date();

      // Overwrite CurrentData (upsert)
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
            timestamp: currentTime,
          },
          { upsert: true, new: true }
        );
      }

      // Insert new snapshot into HistoryData
      const historyRecords = data.map((coin) => ({
        coinId: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.current_price,
        marketCap: coin.market_cap,
        change24h: coin.price_change_percentage_24h,
        timestamp: currentTime,
      }));

      await HistoryData.insertMany(historyRecords);
      console.log(`✅ Cron Job: Updated ${data.length} records successfully at ${currentTime.toLocaleString()}`);
    } catch (err) {
      console.error("Cron Job Error:", err.message);
    }
  });
};
