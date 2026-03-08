import httpx

from backend.state import Credentials


class WooCommerceClient:
    """Async WooCommerce/WordPress API client using httpx."""

    def __init__(self, credentials: Credentials) -> None:
        self.base_url = credentials.site_url.rstrip("/")
        self.auth = (credentials.consumer_key, credentials.consumer_secret)

    async def request(
        self,
        method: str,
        path: str,
        params: dict | None = None,
        json_data: dict | None = None,
    ) -> httpx.Response:
        """Make authenticated request to WC/WP REST API."""
        url = f"{self.base_url}/wp-json/{path}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
                auth=self.auth,
            )
            return response

    async def test_connection(self) -> dict:
        """Test connection by fetching store info."""
        response = await self.request("GET", "wc/v3/")
        response.raise_for_status()
        return response.json()

    async def get(self, path: str, params: dict | None = None) -> httpx.Response:
        return await self.request("GET", path, params=params)

    async def post(self, path: str, json_data: dict | None = None) -> httpx.Response:
        return await self.request("POST", path, json_data=json_data)

    async def put(self, path: str, json_data: dict | None = None) -> httpx.Response:
        return await self.request("PUT", path, json_data=json_data)

    async def delete(self, path: str, params: dict | None = None) -> httpx.Response:
        return await self.request("DELETE", path, params=params)
