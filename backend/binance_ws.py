import asyncio
import websockets
import json
from tortoise.transactions import in_transaction
from models import MarketData

BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/enausdt@kline_1m"

async def binance_websocket(clients):
    """Connects to Binance WebSocket API and sends real-time kline data to FastAPI WebSocket clients."""
    async with websockets.connect(BINANCE_WS_URL) as websocket:
        while True:
            data = json.loads(await websocket.recv())

            # Extract full kline data
            kline = data["k"]
            kline_data = {
                "symbol": data["s"],
                "interval": kline["i"],
                "open_price": float(kline["o"]),
                "high_price": float(kline["h"]),
                "low_price": float(kline["l"]),
                "close_price": float(kline["c"]),
                "volume": float(kline["v"]),
                "trades": int(kline["n"]),
                "final_kline": kline["x"]  # True if kline is complete
            }

            # Save to database using an async transaction
            async with in_transaction():
                await MarketData.create(**kline_data)

            # Send data to all connected WebSocket clients
            if clients:
                for client in clients:
                    await client.send_json(kline_data)

            print(f"Sent to frontend: {kline_data}")


