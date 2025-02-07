from tortoise.models import Model
from tortoise import fields

class User(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=50)
    email = fields.CharField(max_length=100, unique=True)


class MarketData(Model):
    id = fields.IntField(pk=True)
    symbol = fields.CharField(max_length=10)
    interval = fields.CharField(max_length=10)
    open_price = fields.FloatField()
    close_price = fields.FloatField()
    high_price = fields.FloatField()
    low_price = fields.FloatField()
    volume = fields.FloatField()
    trades = fields.IntField()
    final_kline = fields.BooleanField()