
from fastapi import APIRouter, Depends, HTTPException,Request,status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func,or_
from datetime import date
from sqlalchemy.orm import joinedload
# APP
from app.Models.model import Order, Position, Account,PositionStatus,OrderSide,OrderTypes,CreateBy
from app.Database.base import get_db
from app.Core.security import generate_unique_id,get_account_from_token
from app.Schemas.order_schema import *
from app.Models.model import OrderTypes
from app.Core.responseBytb import TBException,TBResponse
from typing from List
from app.Services import orders,
from app.Services.tradebuddy_algo import get_accounts_from_algo
algo_oprator = APIRouter()

@algo_oprator.post("/new_orders/")
async def create_new_orders(
    request: CreateNewOrder,
    accounts: list[Account] = Depends(get_accounts_from_algo),
    db: AsyncSession = Depends(get_db) 
    )->TBResponse:
    """
    New Order Creation for multiple Users:
    - Creates a new position for the stock if it's a buy order.
    - Deducts order margin from the account balance.
    - Position and order are linked using `position_id`.
    """
    try:
        for account in accounts:
            orders.create_order_services(db,account,request)
        return TBResponse(
            message="create new orders for all accounts",
            payload= {}
        )
    except Exception as e :
        db.rollback()
        raise TBException(
            message=str(e),
            resolution=" An error occurred during creating order Try Again",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@order_route.post("/stoploss_orders/")
async def create_stoploss_order(
    request: CreateStoplossOrder,
    accounts: list[Account] = Depends(get_accounts_from_algo), 
    db: AsyncSession = Depends(get_db) 
)->TBResponse:
    """
    Stop-Loss Order for multiple Users:
    - If the position exists, a stop-loss order is created or updated.
    - Updates stop-loss prices and refreshes the order details.
    """
    try:
        for account in accounts:
            orders.create_stoploss_order_services(db,account,request)
        return TBResponse(
            message="create stoplos orders for all accounts",
            payload= {}
        )
    except Exception as e:
        db.rollback()
        raise TBException(
            message=str(e),
            resolution="try again",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@order_route.post("/update_quantity_orders/")
async def update_quantity_order(
    request: UpdateQuantityOrder,
    accounts: list[Account] = Depends(get_accounts_from_algo),  
    db: AsyncSession = Depends(get_db)
) -> TBResponse:
    """
    Quantity Update Order for multiple Users:
    - Adds quantity to an existing position.
    - Updates the position's average price and margin accordingly.
    - Creates a new order.
    """
    try:
        # Fetch the position based on position_id and status
        for account in accounts:
            orders.update_quantity_order_services(db,account,request)
        return TBResponse(
            message="Update quantiry orders for all accounts",
            payload= {}
        )
    except Exception as e:
        await db.rollback()
        raise TBException(
            message=str(e),
            resolution="An error occurred during creating order. Try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    
@order_route.post("/create_exit_all_orders/") 
async def create_exit_order(
    request: CreateExitOrder,
    account: Account = Depends(get_account_from_token), 
    db: AsyncSession = Depends(get_db) 
    ):
    """
    Exit Order:
    - Updates the position's sell quantity and margins.
    - If fully exited, marks the position as completed and calculates the PnL.
    """
    try:
        for account in accounts:
            orders.create_exit_order_services(db,account,request)

        return TBResponse(
            message="create exit orders for all accounts",
            payload= {}
        )
    except Exception as e:
        await db.rollback()
        raise TBException(
            message=str(e),
            resolution="try again",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    