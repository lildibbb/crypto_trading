from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise
from dotenv import load_dotenv
import os
import asyncio


# Load .env from root directory
ROOT_DIR = os.path.dirname(os.path.abspath(__file__)) + "/../"
load_dotenv(dotenv_path=os.path.join(ROOT_DIR, ".env"))

app = FastAPI()



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
