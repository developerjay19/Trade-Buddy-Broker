import random
import string
from fastapi import Request, HTTPException, status, Depends
import jwt
import bcrypt
from datetime import timedelta, datetime
import time
import uuid
# APP
from app.Core.config import setting
from app.Database.base import get_db, AsyncSession
from app.Models.model import Account
from sqlalchemy import select, text
from app.Core.responseBytb import TBException, TBResponse

async def generate_unique_account_id() -> str:
    characters = string.ascii_uppercase + string.digits
    async for db in get_db():
        while True:
            new_id = ''.join(random.choice(characters) for _ in range(5))
            query = text(f"SELECT account_id FROM accounts WHERE account_id = :new_id")
            result = await db.execute(query, {'new_id': new_id})
            existing_id = result.fetchone()

            if not existing_id:
                return str(new_id)


def generate_unique_id(input_string: str) -> str:
    timestamp = time.time() + 19
    timestamp_str = str(timestamp).replace('.', '')  # Remove the dot from the timestamp string
    unique_string = f"TB-{timestamp_str}-{input_string.upper()}"
    return unique_string


def generate_hash_password(password: str):
    hash_password = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(hash_password, salt)
    return hashed_password.decode('utf-8')

def check_hash_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(payload: dict, expiry: timedelta = None):
    payload = payload.copy()
    payload['exp'] = datetime.now() + expiry
    payload['jti'] = str(uuid.uuid4())
    token = jwt.encode(payload, setting.SECRET_KEY, algorithm=setting.JWT_ALGORITHM)
    return token

def decode_token(token: str):
    try:
        payload = jwt.decode(token, setting.SECRET_KEY, algorithms=setting.JWT_ALGORITHM)
        return payload  
    except jwt.PyJWTError:
        raise TBException(
            message="Invalid token format or it has been tampered with.",
            resolution="Check your token for correctness or obtain a new one.",
            status_code=status.HTTP_406_NOT_ACCEPTABLE
        )

from fastapi.security.http import HTTPBearer, HTTPAuthorizationCredentials

class AccessTokenBearer(HTTPBearer):

    def __init__(self, auto_error=True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials | None:
        creds = await super().__call__(request)

        token = creds.credentials

        if not self.token_valid(token):
            raise TBException(
                message="The token is invalid or expired.",
                resolution="Please log in again to receive a new token.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        token_data = decode_token(token)

        if datetime.fromtimestamp(token_data["exp"]) < datetime.now():
            raise TBException(
                message="Access token has expired.",
                resolution="Request a new access token by logging in again.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        return token_data

    def token_valid(self, token: str) -> bool:
        try:
            token_data = decode_token(token)
            return token_data is not None
        except TBException:
            return False

async def get_account_from_token(request: dict = Depends(AccessTokenBearer()), db: AsyncSession = Depends(get_db))->Account:
    result = await db.execute(select(Account).where(Account.account_id == request["AccountId"]))
    account = result.scalars().first()
    if not account:
        raise TBException(
            message="No account found linked to this token.",
            resolution="Verify the token and ensure the account exists.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return account

async def get_accounts_from_algo():
    result = await db.execute(select(Account).where(Account.account_id == request["AccountId"]))
    account = result.scalars().first()
    if not account:
        raise TBException(
            message="No account found linked to this token.",
            resolution="Verify the token and ensure the account exists.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return account
