import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  Time,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
} from "lightweight-charts";

interface KlineData {
  o: number; // open price
  h: number; // high price
  l: number; // low price
  c: number; // close price
}

interface WebSocketMessage {
  symbol: string;
  interval: string;
  k: KlineData;
  volume: number;
  trades: number;
  final_kline: boolean;
}

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const ChartComponent = () => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const [priceData, setPriceData] = useState<CandleData[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#ffffff",
      },
      grid: {
        vertLines: { color: "#2B2B2B" },
        horzLines: { color: "#2B2B2B" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    // Add candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Set up WebSocket
    const wsBaseUrl = import.meta.env.VITE_ENDPOINT_BASE_URL.replace(
      /^http/,
      "ws"
    ).replace(/\/$/, "");
    const ws = new WebSocket(`${wsBaseUrl}/ws`);
    websocketRef.current = ws;

    ws.addEventListener("open", () => {
      console.log("WebSocket connected!");
    });

    ws.addEventListener("message", (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log("Received market data:", message);

        const candleData: CandleData = {
          time: Math.floor(Date.now() / 1000) as Time,
          open: message.k.o,
          high: message.k.h,
          low: message.k.l,
          close: message.k.c,
        };

        // Update price data
        setPriceData((prevData) => {
          const newData = [...prevData];
          if (message.final_kline) {
            // If candle is closed, add it as a new candle
            newData.push(candleData);
          } else {
            // If candle is still open, update the last candle
            if (newData.length > 0) {
              newData[newData.length - 1] = candleData;
            } else {
              newData.push(candleData);
            }
          }
          return newData.slice(-100); // Keep last 100 candles
        });

        // Update the chart
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update(candleData);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    });

    ws.addEventListener("close", () => {
      console.log("WebSocket closed! Reconnecting...");
      setTimeout(() => {
        // Implement reconnection logic here
        if (websocketRef.current?.readyState === WebSocket.CLOSED) {
          websocketRef.current = new WebSocket(`${wsBaseUrl}/ws`);
        }
      }, 3000);
    });

    ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    });

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ENA/USDT</h1>
      <div className="text-white">
        {priceData.length > 0 && (
          <div className="flex gap-4">
            <p>
              Current Price: {priceData[priceData.length - 1].close.toFixed(4)}
            </p>
            <p>Volume: {priceData.length} candles</p>
          </div>
        )}
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default ChartComponent;
