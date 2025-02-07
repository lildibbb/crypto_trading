import os
from dotenv import load_dotenv
from tortoise import Tortoise

# Load environment variables from .env file
ROOT_DIR = os.path.dirname(os.path.abspath(__file__)) + "/../"
load_dotenv(dotenv_path=os.path.join(ROOT_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

async def init_db():
    """Initialize database connection."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set. Check your .env file.")

    await Tortoise.init(
        db_url=DATABASE_URL,
        modules={"models": ["models"]}
    )
    await Tortoise.generate_schemas()
    print("✅ Database initialized successfully!")

# ✅ Add this for Aerich to work properly
TORTOISE_ORM = {
    "connections": {"default": DATABASE_URL},
    "apps": {
        "models": {
            "models": ["models", "aerich.models"],  # Include Aerich migrations
            "default_connection": "default",
        },
    },
}
