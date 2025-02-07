import asyncio
import websockets
import json
from models import MarketData
from tortoise.transactions import in_transaction

BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/enausdt@trade"

async def binance_websocket():
    """Connects to Binance WebSocket API and saves price data."""
    async with websockets.connect(BINANCE_WS_URL) as websocket:
        while True:
            data = json.loads(await websocket.recv())
            price = float(data["p"])  # Get latest BTC/USDT price

            # Save to database using an async transaction
            async with in_transaction():
                await MarketData.create(symbol="ENA/USDT", price=price)

            print(f"Live ENA/USDT Price: {price}")  # Debugging output
            await asyncio.sleep(1)  # Adjust for API rate limits
