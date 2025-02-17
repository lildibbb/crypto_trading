import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  Time,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  PriceScaleMode,
} from "lightweight-charts";
import { fetchAssetLogo } from "@/lib/api";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

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
  const [logo, setLogo] = useState<string | null>(null);
  const [previousSymbol, setPreviousSymbol] = useState<string | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: "white" },
        textColor: "black",
      },
      grid: {
        vertLines: { color: "#D6DCDE" },
        horzLines: { color: "#D6DCDE" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        mode: PriceScaleMode.Normal,
        autoScale: true,
        visible: true,
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      },
    });

    // Add candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: true,
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    chart.timeScale().fitContent();
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
        // Only fetch logo if the symbol has changed
        if (message.symbol !== previousSymbol) {
          fetchAssetLogo(message.symbol).then((logoUrl) => {
            setLogo(logoUrl); // Update logo if symbol changes
          });

          // Update the previous symbol state
          setPreviousSymbol(message.symbol);
        }
        // Update the chart
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update(candleData);
        }
        // Calculate price change percentage
        if (previousPrice !== null) {
          const change =
            ((candleData.close - previousPrice) / previousPrice) * 100;
          setPriceChangePercent(change); // Update the percentage change
        } else {
          // Skip calculation for the first candle
          setPriceChangePercent(0);
        }

        // Update previous price to current close price
        setPreviousPrice(candleData.close);
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

  // Render the chart component
  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center ">
        <div className="flex items-center gap-3">
          {logo && (
            <img
              src={logo || "/placeholder.svg"}
              alt="ENA Token"
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">ENA/USDT</h1>
            <p className="text-sm text-muted-foreground">Ethena</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                priceChangePercent < 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              {priceData.length > 0
                ? priceData[priceData.length - 1].close.toFixed(4)
                : "Loading..."}
            </span>
            {priceChangePercent !== 0 && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  priceChangePercent > 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {priceChangePercent > 0 ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                <span>{Math.abs(priceChangePercent).toFixed(2)}%</span>
              </div>
            )}
          </div>

          {/* Wrap ≈ and price in a flex container with proper spacing */}
          <div className="flex items-center gap-1">
            <p className="text-sm text-muted-foreground mb-0">≈</p>{" "}
            {/* Adjusted margin-bottom */}
            <p className="font-medium mb-0">
              {priceData.length > 0
                ? priceData[priceData.length - 1].close.toFixed(4)
                : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* <Separator /> */}

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">24h High</p>
          {/* <p className="font-medium">${high24h.toFixed(4)}</p> */}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">24h Low</p>
          {/* <p className="font-medium">${low24h.toFixed(4)}</p> */}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">24h Volume</p>
          <p className="font-medium">
            {/* {last24Hours.reduce((sum, d) => sum + d.volume, 0).toFixed(2)}{" "} */}
            USDT
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default ChartComponent;
