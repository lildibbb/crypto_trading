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
                "k": { 
                    "o": float(kline["o"]),  # open price
                    "h": float(kline["h"]),  # high price
                    "l": float(kline["l"]),  # low price
                    "c": float(kline["c"]),  # close price
                },
                "volume": float(kline["v"]),
                "trades": int(kline["n"]),
                "final_kline": kline["x"]
            }

            # Save to database using an async transaction
            async with in_transaction():
                await MarketData.create(**kline_data)

            # Log messages to confirm data is being sent
            print(f"Sending data to {len(clients)} clients: {kline_data}")

            # Send data to all connected WebSocket clients
            for client in clients[:]:  # Use a copy of the list to avoid iteration issues
                try:
                    await client.send_json(kline_data)
                except Exception as e:
                    print(f"⚠️ Error sending data: {e}")
                    clients.remove(client)  # Remove disconnected clients

            await asyncio.sleep(1)  # Prevent flooding
