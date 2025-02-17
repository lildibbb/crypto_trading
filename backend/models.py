from tortoise.models import Model
from tortoise import fields

class User(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50)
    email = fields.CharField(max_length=100, unique=True)


class MarketData(Model):
    id = fields.IntField(pk=True)
    symbol = fields.CharField(max_length=10)  # Example: ENA/USDT
    interval = fields.CharField(max_length=10)  # Interval for the kline (e.g., "1m")
    k = fields.JSONField(null=True)  # Store the nested OHLC data in a JSON field
    volume = fields.FloatField(null=True)  # Volume
    trades = fields.IntField(null=True)  # Number of trades
    final_kline = fields.BooleanField(null=True)  # Final kline flag
    timestamp = fields.DatetimeField(auto_now_add=True)  # Timestamp when the entry is created

    class Meta:
        table = "marketdata"  # Ensure the table name matches your database