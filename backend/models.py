from tortoise.models import Model
from tortoise import fields

class User(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50)
    email = fields.CharField(max_length=100, unique=True)

class MarketData(Model):
    id = fields.IntField(pk=True)
    symbol = fields.CharField(max_length=10)  # Example: BTC/USDT
    price = fields.FloatField()
    timestamp = fields.DatetimeField(auto_now_add=True)
