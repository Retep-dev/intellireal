"""
IntelliReal - Supabase Authentication Middleware
Verifies JWT tokens from Supabase Auth and extracts user identity.
"""

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from functools import lru_cache
import httpx
import jwt
import logging

from config import get_settings

logger = logging.getLogger(__name__)
security = HTTPBearer()


@lru_cache()
def get_supabase_client() -> Client:
    """Create and cache a Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify Supabase JWT and return user data.
    
    Used as a FastAPI dependency to protect routes:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(verify_token)):
            user_id = user["sub"]
    """
    token = credentials.credentials
    settings = get_settings()

    try:
        # Fetch Supabase JWKS for verification
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            jwks = response.json()

        # Decode and verify the JWT
        # Supabase uses RS256 with their JWKS
        header = jwt.get_unverified_header(token)
        
        # Find the matching key
        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == header.get("kid"):
                rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token: key not found")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_exp": True}
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user_id(user: dict = Depends(verify_token)) -> str:
    """Extract user ID from verified token. Use as dependency for route handlers."""
    return user.get("sub", "")


# Development-only: skip auth for testing
async def get_dev_user_id() -> str:
    """Returns a static user ID for development/testing without auth."""
    return "dev-user-001"
