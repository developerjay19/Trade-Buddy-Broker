from app.Database.base import Base
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, func, ForeignKey, Enum as sqlEnum
from enum import Enum
from sqlalchemy.orm import relationship


class OrderSide(Enum):
    BUY = 'BUY'
    SELL = 'SELL'

class PositionStatus(Enum):
    PENDING = 'Pending'
    COMPLETED = 'Completed'


class TransactionType(Enum):
    DEPOSIT="Deposit"
    WITHDRAW="Withdraw"
    

class OrderTypes(Enum):
    NewOrder = "New Order"
    StopLossOrder = "Stoploss Order"
    UpdateQtyOrder = "Update Quantity Order"
    ExitOrder = "Exit Order"

class CreateBy(Enum):
    MENUAL = "Menual"
    ALGO = "Algo"

class ProductType(Enum):
    CNC = 'CNC'
    INTRADAY = 'Intraday'
    MARGIN = 'Margin'

class StockType(Enum):
    STOCK = 'Stocks'
    OPTION ='Option'



class Account(Base):
    """Account model."""
    INITIAL_BALANCE: float = 0.00
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(String, unique=True, nullable=False)
    full_name =Column(String,nullable=False)
    balance = Column(Float, default=INITIAL_BALANCE)
    email_id = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email_verified = Column(Boolean, default=False)
    role = Column(String, default="User")
    is_activate = Column(Boolean, default=True)
    algo_trading = Column(Boolean, default=False)
    description = Column(String,nullable=False,default="You are awsome")
    max_trad_per_day = Column(Integer, default=5)
    todays_margin = Column(Float, default=0.0)
    todays_single_trade_margin = Column(Float, default=0.0)
    base_stoploss = Column(Float, default=0.0)
    base_target = Column(Float, default=0.0)
    trailing_status = Column(Boolean, default=True)
    trailing_stoploss = Column(Float, default=0.0)
    trailing_target = Column(Float, default=0.0)
    created_datetime = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship('Transaction', back_populates='account')
    positions = relationship('Position', back_populates='account')
    orders = relationship('Order', back_populates='account')


class Transaction(Base):
    """Transaction model."""
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String, unique=True, nullable=False)
    account_id = Column(String, ForeignKey('accounts.account_id'), nullable=False)
    transaction_type = Column(sqlEnum(TransactionType), nullable=False, default=TransactionType.DEPOSIT)
    transaction_amount = Column(Float, nullable=False)
    transaction_note = Column(String)
    transaction_datetime = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    account = relationship('Account', back_populates='transactions')

class Position(Base):
    """Position model."""
    __tablename__ = 'positions'

    position_id = Column(String, primary_key=True, nullable=False)
    account_id = Column(String, ForeignKey('accounts.account_id'), nullable=False)
    stock_symbol = Column(String, nullable=False)
    stock_type = Column(sqlEnum(StockType), nullable=False, default=StockType.STOCK)

    position_status = Column(sqlEnum(PositionStatus), nullable=False, default=PositionStatus.PENDING)
    position_side = Column(sqlEnum(OrderSide), nullable=False, default=OrderSide.BUY)
    product_type = Column(sqlEnum(ProductType), nullable=False, default=ProductType.CNC)

    trailing_count = Column(Integer, default=0)
    buy_average = Column(Float, nullable=False, default=0)
    buy_margin = Column(Float, nullable=False, default=0)
    buy_quantity = Column(Integer, nullable=False, default=0)
    sell_average = Column(Float, nullable=False, default=0)
    sell_margin = Column(Float, nullable=False, default=0.0)
    sell_quantity = Column(Integer, nullable=False, default=0)
    pnl_total = Column(Float, nullable=False, default=0)
    target_price = Column(Float, nullable=False)
    stoploss_price = Column(Float, nullable=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(sqlEnum(CreateBy), nullable=False, default=CreateBy.MENUAL)

    account = relationship('Account', back_populates='positions')
    orders = relationship('Order', back_populates='position')

class Order(Base):
    __tablename__ = 'orders'
    order_id = Column(String, primary_key=True, nullable=False)
    account_id = Column(String, ForeignKey('accounts.account_id'), nullable=False)
    position_id = Column(String, ForeignKey('positions.position_id'), nullable=False)
    stock_symbol = Column(String, nullable=False)

    order_side = Column(sqlEnum(OrderSide), nullable=False, default=OrderSide.BUY)
    order_types = Column(sqlEnum(OrderTypes), nullable=False, default=OrderTypes.NewOrder)
    product_type = Column(sqlEnum(ProductType), nullable=False, default=ProductType.CNC)

    price = Column(Float)
    quantity = Column(Integer)

    stop_order_hit = Column(Boolean, default=False)
    stop_order_activate = Column(Boolean, default=False)
    stoploss_price = Column(Float)
    target_price = Column(Float)
    order_datetime = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(sqlEnum(CreateBy), nullable=False, default=CreateBy.MENUAL) 

    # Relationships
    account = relationship('Account', back_populates='orders')
    position = relationship('Position', back_populates='orders')

from datetime import datetime
class TicketDB(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, index=True)
    title = Column(String)
    message = Column(String)
    replied = Column(Boolean, default=False)
    datetime = Column(DateTime(timezone=True), server_default=func.now())
    replies = relationship("ReplyDB", back_populates="ticket")

class ReplyDB(Base):
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    datetime = Column(DateTime(timezone=True), server_default=func.now())
    ticket_id = Column(String, ForeignKey("tickets.id"))
    ticket = relationship("TicketDB", back_populates="replies")