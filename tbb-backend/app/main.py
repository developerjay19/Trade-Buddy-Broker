from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.Database.base import init_db
from fastapi.middleware.cors import CORSMiddleware
from art import text2art


# APP
from app.Core.responseBytb import TBException
from app.Routes.auth import auth_rout
from app.Routes.admin import admin_route
from app.Routes.orders import order_route
from app.Routes.transaction import transaction_route
from app.Routes.liveprice import live_price_route
from app.Routes.tb_algo import algo_operator
async def start_system():
    print(text2art("TRADE BUDDY Start",font="small"))
    await init_db()

async def shutdown_system():
    print(text2art("TRADE BUDDY Shutdown",font="small"))

@asynccontextmanager
async def connectingTodb(app: FastAPI):
    await start_system()
    yield
    await shutdown_system()


app = FastAPI(
    title="Trade Buddy Paper Trading System",
    description="A platform for paper trading where users can simulate trading without real investments.",
    version="1.0.0", 
    summary="Create a paper trading platform for simulating trades and managing virtual portfolios.",
    lifespan=connectingTodb
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://trade-buddy-umber.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Error
@app.exception_handler(TBException)
async def custom_exception_handler(request: Request, exc: TBException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "message": exc.message,
            "resolution": exc.resolution
        }
    )


# Internal Server Error
@app.exception_handler(Exception)
async def internal_server_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status_code": 500,
            "message": "An internal server error occurred.",
            "resolution": "Please contact support."
        }
    )

import socket
import os
@app.get("/")
@app.get("/host-info")
async def get_host_info(request: Request):
    hostname = socket.gethostname()  # Get the hostname of the server
    host_ip = request.client.host  # Get the IP address of the client
    headers = dict(request.headers)
    protocol = headers.get("x-forwarded-proto","http")
    host = headers.get("host","localhost"),
    redirect_docs = f"{protocol}://{request.url.hostname}/docs"
    return {
        "hostname": hostname,
        "host_ip": host_ip,
        "protocol": protocol,
        "host": host,
        "redirect_docs": redirect_docs
    }
    
   

app.include_router(admin_route,prefix="/admin",tags=["Admin Page"])
app.include_router(auth_rout,prefix="/auth",tags=["User Login and Registartion"])
app.include_router(order_route,prefix="/order",tags=["Orders Management"])
app.include_router(transaction_route,prefix="/transaction",tags=["Account Balance Transaction"])
app.include_router(live_price_route,prefix="/live_data",tags=["Fetch Live Data"])
app.include_router(algo_operator,prefix="/algo_operator",tags=["Orders management for Algo User"])
