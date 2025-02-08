import os
import sys
import asyncio
import subprocess
import shutil
from database import init_db
from tortoise import Tortoise
from tortoise.transactions import in_transaction  # ✅ Import in_transaction
from models import MarketData  # ✅ Import MarketData model

# Function to check if a command exists
def check_dependency(command, required=False):
    """Check if a command is available and optionally exit if required."""
    
    # Use shutil.which() to check if command exists
    if shutil.which(command) is None:
        if required:
            print(f"❌ Error: `{command}` is not installed or not in PATH. Run `pip install {command}`.")
            exit(1)
        else:
            print(f"⚠️ Warning: `{command}` is not installed. This may affect some features.")
        return  # Exit function early

    # Try running the command to confirm it works
    try:
        result = subprocess.run([command, "--help"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode == 0:
            print(f"✅ `{command}` is installed and working.")
            return  # Exit function
    except Exception as e:
        print(f"⚠️ Warning: `{command}` check failed, but continuing... ({e})")

# Ensure required dependencies are installed
check_dependency("hypercorn", required=True)  # Required for starting the server
check_dependency("aerich", required=False)  # Optional (migration commands will still work)

# Define available commands
def start_server():
    """Start FastAPI server using Hypercorn"""
    print("🚀 Starting FastAPI server...")
    subprocess.run(["hypercorn", "main:app", "--bind", "0.0.0.0:8000", "--reload"])

def run_init_db():
    """Initialize the database schema (Only needed for first-time setup)"""
    print("🔄 Initializing database schema...")
    subprocess.run(["aerich", "init-db"])
    print("✅ Database initialized.")

def run_migrations():
    """Run database migrations using Aerich"""
    print("📦 Running database migrations...")
    subprocess.run(["aerich", "migrate"])
    subprocess.run(["aerich", "upgrade"])
    print("✅ Migrations applied successfully.")

def reset_db():
    """Drop and recreate the database schema"""
    print("⚠️  Dropping and recreating the database...")
    asyncio.run(init_db())
    print("✅ Database has been reset.")

async def flush():
    """Ensure Tortoise is initialized before flushing data."""
    await Tortoise.init(
        db_url= os.getenv("DATABASE_URL"),
        modules={"models": ["models"]}
    )
    async with in_transaction():
        await MarketData.all().delete()
    print("✅ MarketData table flushed.")

    await Tortoise.close_connections()  # Close DB connections after flushing

def flush_db():
    """Wrapper function to run the async flush()"""
    print("🗑️  Flushing MarketData table...")
    asyncio.run(flush())

# Command-line argument handling
COMMANDS = {
    "start": start_server,
    "initdb": run_init_db,  # ✅ Added missing `initdb` command
    "migrate": run_migrations,
    "resetdb": reset_db,
    "flushdb": flush_db,  # ✅ Now correctly defined
}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ No command provided. Available commands: start, initdb, migrate, resetdb, flushdb")
        sys.exit(1)

    command = sys.argv[1]
    if command in COMMANDS:
        COMMANDS[command]()
    else:
        print(f"❌ Unknown command: {command}. Available commands: {', '.join(COMMANDS.keys())}")
        sys.exit(1)
