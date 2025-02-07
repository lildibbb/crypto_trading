from fastapi import FastAPI, WebSocket
from tortoise.contrib.fastapi import register_tortoise
from dotenv import load_dotenv
import os
import asyncio
from binance_ws import binance_websocket  # Import Binance WebSocket function
from models import MarketData  # Import the MarketData model
from tortoise.transactions import in_transaction
from tortoise import Tortoise
# Load .env file
ROOT_DIR = os.path.dirname(os.path.abspath(__file__)) + "/../"
load_dotenv(dotenv_path=os.path.join(ROOT_DIR, ".env"))

app = FastAPI()
clients = []  # WebSocket clients list

@app.on_event("startup")
async def startup_event():
    """Initialize DB and start Binance WebSocket streaming on FastAPI startup"""
    asyncio.create_task(binance_websocket(clients))  # Pass `clients` list to Binance WebSocket

@app.get("/")
async def root():
    return {"message": "FastAPI with WebSockets for real-time crypto!"}

# Register TortoiseORM with FastAPI
register_tortoise(
    app,
    db_url=os.getenv("DATABASE_URL"),
    modules={"models": ["models"]},
    generate_schemas=True,
    add_exception_handlers=True,
)

# Endpoint to get market data (historical)
@app.get("/MarketData")
async def get_market_data():
    """Fetch market data from the database."""
    return await MarketData.all()

# FastAPI WebSocket for frontend clients
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for frontend clients."""
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await asyncio.sleep(1)  # Keep connection alive
    except Exception:
        pass
    finally:
        clients.remove(websocket)

# Delete all data from the database
@app.delete("/flush")
async def flush_market_data():
    """Delete all market data from the database."""
    async with in_transaction():
        await MarketData.all().delete()
    return {"message": "Market data flushed successfully"}
