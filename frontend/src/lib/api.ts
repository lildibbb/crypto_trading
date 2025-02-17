const apiBaseUrl = import.meta.env.VITE_ENDPOINT_BASE_URL;
console.log("apiBaseUrl: " + apiBaseUrl);

//fetch data from the API

export const fetchCandleStickData = async () => {
  const response = await fetch(`${apiBaseUrl}/MarketData`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch candle stick data");
  }
  return await response.json();
};

export const connectWebSocket = () => {
  const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");
  let socket: WebSocket;

  const connect = (): WebSocket => {
    // Create new WebSocket connection
    const ws = new WebSocket(`${wsBaseUrl}/ws`);

    // Add event listeners
    ws.addEventListener("open", () => {
      console.log("WebSocket connected!");
    });

    ws.addEventListener("message", (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("📡 Received Binance market update:", data);
      // Process incoming data here
    });

    ws.addEventListener("close", () => {
      console.log("WebSocket closed! Reconnecting...");
      // Reconnect after 3 seconds
      setTimeout(() => {
        socket = connect();
      }, 3000);
    });

    ws.addEventListener("error", (error: Event) => {
      console.error("WebSocket error:", error);
      ws.close(); // Close the connection on error to trigger reconnect
    });

    return ws;
  };

  // Start the initial connection
  socket = connect();

  return socket;
};

export const fetchAssetLogo = async (symbol: string) => {
  const token = symbol.split("USDT")[0].toLowerCase();
  return `https://assets.coincap.io/assets/icons/${token}@2x.png`;
};
