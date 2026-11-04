from pynamodb.attributes import MapAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.indexes import AllProjection, GlobalSecondaryIndex
from pynamodb.models import Model
from schemas import FxBalance
from settings import settings


class UserBalanceModel(Model):
    """
    A DynamoDB User Balance
    """

    class Meta:
        table_name = settings.fx_balance_table_name

    ActorId = UnicodeAttribute(hash_key=True)
    Balance = MapAttribute(
        JPY=NumberAttribute(),
        USD=NumberAttribute(),
        EUR=NumberAttribute(),
        GBP=NumberAttribute(),
    )
    LatestTransactionId = UnicodeAttribute(null=True)

    def to_fx_balance(self) -> FxBalance:
        return FxBalance(
            JPY=int(self.Balance.JPY),
            USD=int(self.Balance.USD),
            EUR=int(self.Balance.EUR),
            GBP=int(self.Balance.GBP),
        )


class UserBalanceHistoryModel(Model):
    """
    A DynamoDB User Balance History
    """

    class Meta:
        table_name = settings.fx_balance_history_table_name

    ActorId = UnicodeAttribute(hash_key=True)
    Timestamp = UnicodeAttribute(range_key=True)
    TransactionId = UnicodeAttribute()
    Balance = MapAttribute(
        JPY=NumberAttribute(),
        USD=NumberAttribute(),
        EUR=NumberAttribute(),
        GBP=NumberAttribute(),
    )
    TotalJpyValue = NumberAttribute()


class ActorIdIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "actor-id-index"
        projection = AllProjection()
        # プロビジョニングモードの場合のみ必要
        # read_capacity_units = 1
        # write_capacity_units = 1

    # GSIのパーティションキー
    ActorId = UnicodeAttribute(hash_key=True)
    # GSIのソートキー(任意)
    Timestamp = UnicodeAttribute(range_key=True)


class OrderHistoryModel(Model):
    """
    A DynamoDB Order History
    """

    class Meta:
        table_name = settings.fx_order_history_table_name

    TransactionId = UnicodeAttribute(hash_key=True)
    ActorId = UnicodeAttribute()
    Timestamp = UnicodeAttribute()
    Ticker = UnicodeAttribute()
    Quantity = NumberAttribute()
    Price = NumberAttribute()
    OrderSummary = UnicodeAttribute(null=True)

    # インデックスをクラス属性として登録
    actor_id_index = ActorIdIndex()
