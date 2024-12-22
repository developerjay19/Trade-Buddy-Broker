from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from datetime import date
from typing import List

# APP Imports
from app.Models.model import (
    Order, Position, Account, PositionStatus, OrderSide,
    OrderTypes, CreateBy
)
from app.Database.base import get_db
from app.Core.security import generate_unique_id, get_account_from_token,get_accounts_from_algo
from app.Schemas.order_schema import (
    CreateNewOrder, CreateStoplossOrder, CreateExitOrder
)
from app.Core.responseBytb import TBException, TBResponse
from app.Services import orders

algo_operator = APIRouter()

@algo_operator.post("/new_orders/")
async def create_new_orders(
    request: CreateNewOrder,
    accounts: List[Account] = Depends(get_accounts_from_algo),
    db: AsyncSession = Depends(get_db)
) -> TBResponse:
    """
    New Order Creation for multiple Users:
    - Creates a new position for the stock if it's a buy order.
    - Deducts order margin from the account balance.
    - Position and order are linked using `position_id`.
    """
    try:
        for account in accounts:
            print(account.account_id)
            await orders.create_order_services(db, account, request)
        return TBResponse(
            message="Created new orders for all accounts",
            payload={}
        )
    except Exception as e:
        await db.rollback()
        raise TBException(
            message=str(e),
            resolution="An error occurred while creating orders. Try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@algo_operator.post("/stoploss_orders/")
async def create_stoploss_order(
    request: CreateStoplossOrder,
    db: AsyncSession = Depends(get_db)
) -> TBResponse:
    """
    Stop-Loss Order for multiple Users:
    - If the position exists, a stop-loss order is created or updated.
    - Updates stop-loss prices and refreshes the order details.
    """
    try:
        await orders.create_stoploss_order_services(db, request)
        return TBResponse(
            message="Created stop-loss orders for all accounts",
            payload={}
        )
    except Exception as e:
        await db.rollback()
        raise TBException(
            message=str(e),
            resolution="An error occurred while creating stop-loss orders. Try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@algo_operator.post("/create_exit_all_orders/")
async def create_exit_order(
    request: CreateExitOrder,
    db: AsyncSession = Depends(get_db)
) -> TBResponse:
    """
    Exit Order:
    - Updates the position's sell quantity and margins.
    - If fully exited, marks the position as completed and calculates the PnL.
    """
    try:
        await orders.create_exit_order_services(db, request)
        return TBResponse(
            message="Created exit orders for all accounts",
            payload={}
        )
    except Exception as e:
        await db.rollback()
        raise TBException(
            message=str(e),
            resolution="An error occurred while creating exit orders. Try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@algo_operator.get("/all_open_positions")
async def get_all_open_positions(db: AsyncSession = Depends(get_db)):
    try:
        query = (
            select(Position)
            .options(joinedload(Position.orders))
            .join(Account, Position.account_id == Account.account_id)  # Join Position with Account
            .where(
                Position.position_status == PositionStatus.PENDING,
                Account.algo_trading == True  # Filter for algo_trading == True
            )
            .order_by(Position.created_date.desc())
        )
        result = await db.execute(query)
        positions = result.unique().scalars().all()
        return {"positions":positions}
    except Exception as e:
        await db.rollback()
        raise TBException(
            message=str(e),
            resolution="An error occurred while creating exit orders. Try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )