from app.Core.security import generate_unique_id
from app.Models.model import Order, Position, Account,PositionStatus,OrderSide,OrderTypes,CreateBy 
from app.Core.responseBytb import TBException,TBResponse

def create_order_services(db,account,request):
        order_margin = request.quantity * request.price
        position_id = generate_unique_id("TRD")

        position_data = {
            "position_id": position_id,
            "account_id": account.account_id,
            "stock_symbol": request.stock_symbol,
            "stock_type": request.stock_type,
            "created_by": request.created_by,
            "stoploss_price":request.stoploss_price,
            "target_price":request.target_price
        }
        create_order = {
            "order_id": generate_unique_id("ORD"),
            "account_id": account.account_id,
            "position_id": position_id,
            "stock_symbol": request.stock_symbol,
            "order_types": OrderTypes.NewOrder,
            "order_side": request.order_side,
            "product_type": "CNC",
            "stop_order_hit": None,
            "stop_order_activate":True,
            "price": request.price,
            "stoploss_price": request.stoploss_price,
            "target_price": request.target_price,
            "quantity": request.quantity,
            "created_by": request.created_by
        }
        if order_margin > account.balance:
                raise Exception("Insufficient balance to place the order, Your Balance is {account.balance}")

        if request.order_side == OrderSide.BUY:
            position_data.update({
                "buy_average": request.price,
                "buy_quantity": request.quantity,
                "buy_margin": order_margin,
                "position_side" :OrderSide.BUY
            })
        elif request.order_side == OrderSide.SELL:
            position_data.update({
                "sell_average": request.price,
                "sell_quantity": request.quantity,
                "sell_margin": order_margin,
                "position_side" :OrderSide.SELL
            })

        account.balance -= order_margin
        position = Position(**position_data)
        order = Order(**create_order)
        db.add_all([account, position, order])
        await db.commit()
        await db.refresh(order)
        await db.refresh(position)
        await db.refresh(account)


        msg = f"New position created for {position_id} with {request.quantity} Quantity"
        return True


def create_stoploss_order_services(db,account,request):
        position = await db.scalar(select(Position).where(
            Position.position_id == request.position_id,
            Position.position_status == PositionStatus.PENDING
        ))


        if not position:
            raise Exception("Position not found")
        


        stop_order = await db.scalar(select(Order).where(
            Order.position_id == position.position_id,
            or_(
                Order.order_types == OrderTypes.StopLossOrder,
                Order.order_types == OrderTypes.NewOrder
            ),
            Order.stop_order_hit == False,
            Order.stop_order_activate == True
        ))

        position.target_price = request.target_price
        position.stoploss_price = request.stoploss_price

        if stop_order:
            stop_order.stop_order_activate = False

        create_stoploss_order = {
            "order_id": generate_unique_id("ORD"),
            "account_id": account.account_id,
            "position_id": position.position_id,
            "stock_symbol": position.stock_symbol,
            "order_types": OrderTypes.StopLossOrder,
            "product_type": position.product_type,
            "stoploss_price": request.stoploss_price,
            "target_price": request.target_price,
            "quantity": request.quantity,
            "created_by": request.created_by
        }
        order = Order(**create_stoploss_order)

        # Add new stop-loss order to session
        db.add_all([order,position])
        if stop_order:
            db.add(stop_order)    
        await db.commit()
        await db.refresh(order)
        await db.refresh(position)
        if stop_order:
            await db.refresh(stop_order)

        msg = "New Stop-loss Order Created" if not stop_order else "Stop-loss Order Updated"

        return True


def update_quantity_order_services(db,account,request):
        position = await db.scalar(select(Position).where(
            Position.position_id == request.position_id,
            Position.position_status == PositionStatus.PENDING
        ))

        if position is None:
            raise Exception("Position not found!")

        if (request.order_side != position.position_side) and (request.quantity > abs(position.buy_quantity-position.sell_quantity)):
            raise Exception("Quantity not allow try again with another quantity")
        order_margin = request.quantity * request.price

        # Check for sufficient balance
        if order_margin > account.balance and position.position_side == request.order_side:
            raise Exception("Insufficient balance to place the order")

        # Update Position
        if request.order_side == OrderSide.BUY:
            position.buy_quantity += request.quantity
            position.buy_margin += order_margin
            position.buy_average = round((
                (position.buy_average * (position.buy_quantity - request.quantity) + request.price * request.quantity) /
                position.buy_quantity
            ), 2)

        elif request.order_side == OrderSide.SELL:
            position.sell_quantity += request.quantity
            position.sell_margin += order_margin
            position.sell_average = round((
                (position.sell_average * (position.sell_quantity - request.quantity) + request.price * request.quantity) /
                position.sell_quantity
            ), 2)

        # Update PnL if position side changes
        if position.position_side != request.order_side:
            position.pnl_total = round(
                (abs(position.buy_average - position.sell_average)) *
                (abs((position.buy_quantity + position.sell_quantity) / 2)), 2
            )

        # Update Account Balance
        account.balance += -order_margin if position.position_side == request.order_side else order_margin

        # Check if it's a full exit
        if position.buy_quantity == position.sell_quantity and position.position_status == PositionStatus.PENDING:
            pnl = (position.sell_average - position.buy_average) * position.sell_quantity
            position.pnl_total += pnl
            position.position_status = PositionStatus.COMPLETED
            msg = f"Position fully exited, PnL calculated: {pnl}"
            order_type = OrderTypes.ExitOrder
        else:
            msg = f"Quantity added to {request.order_side} position"
            order_type = OrderTypes.UpdateQtyOrder

        # Create a new order
        qty_update_order = {
            "order_id": generate_unique_id("ORD"),
            "account_id": account.account_id,
            "position_id": position.position_id,
            "stock_symbol": position.stock_symbol,
            "order_types": order_type,
            "order_side": request.order_side,
            "product_type": "CNC",
            "stop_order_hit": None,
            "price": request.price,
            "quantity": request.quantity,
            "created_by": request.created_by
        }

        order = Order(**qty_update_order)
        db.add_all([position, order, account])
        await db.commit()
        await db.refresh(position)
        await db.refresh(order)
        await db.refresh(account)
        return True
def create_exit_order_services(db,account,request):
        position = await db.scalar(select(Position).where(
                Position.position_id == request.position_id,
                Position.position_status == PositionStatus.PENDING
            ))
        if position is None:
            raise Exception("Position is not valid")
        
        sell_qty = (abs(position.buy_quantity-position.sell_quantity))
        sell_order = {
                "order_id": generate_unique_id("ORD"),
                "account_id": account.account_id,
                "position_id": position.position_id,
                "stock_symbol": position.stock_symbol,
                "order_types": OrderTypes.ExitOrder,
                "order_side":  OrderSide.SELL if position.position_side ==OrderSide.BUY else OrderSide.BUY,
                "product_type": position.product_type,
                "stop_order_hit": True,
                "price": request.price,
                "quantity": sell_qty,
                "created_by": request.created_by
            }
        order_margin = sell_qty * request.price
        
        if position.position_side == OrderSide.BUY:
                position.sell_quantity += sell_qty
                position.sell_margin += order_margin
                position.sell_average = (
                    (position.sell_average * (position.sell_quantity - sell_qty) + request.price * sell_qty) /
                    position.sell_quantity
                )
        elif position.position_side == OrderSide.SELL:
            position.buy_quantity += sell_qty
            position.buy_margin += order_margin
            position.buy_average = (
                (position.buy_average * (position.buy_quantity -sell_qty) + request.price *sell_qty) /
                position.buy_quantity
            )

        if position.buy_quantity == position.sell_quantity and position.position_status == PositionStatus.PENDING:
            pnl = (position.sell_average - position.buy_average) * position.sell_quantity
            position.pnl_total += pnl
            position.position_status = PositionStatus.COMPLETED
            msg = f"Position fully exited, PnL calculated: {pnl}"
        else:
            msg = "Exit order executed"

        account.balance += order_margin
        order = Order(**sell_order)
        db.add_all([position, order,account])
        await db.commit()
        await db.refresh(position)
        await db.refresh(order)
        await db.refresh(account)

        return True