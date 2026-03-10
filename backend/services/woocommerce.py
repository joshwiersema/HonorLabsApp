import httpx

from backend.state import Credentials


class WooCommerceClient:
    """Async WooCommerce/WordPress API client using httpx."""

    def __init__(self, credentials: Credentials) -> None:
        self.base_url = credentials.site_url.rstrip("/")
        self.auth = (credentials.consumer_key, credentials.consumer_secret)

    @property
    def auth_params(self) -> dict[str, str]:
        """Return credentials as query params for non-WC REST endpoints.

        WooCommerce's built-in endpoints accept HTTP Basic Auth, but custom
        WordPress REST endpoints (honor-labs/v1/*) expect consumer_key and
        consumer_secret as query parameters.
        """
        return {
            "consumer_key": self.auth[0],
            "consumer_secret": self.auth[1],
        }

    async def request(
        self,
        method: str,
        path: str,
        params: dict | None = None,
        json_data: dict | None = None,
        *,
        query_auth: bool = False,
    ) -> httpx.Response:
        """Make authenticated request to WC/WP REST API.

        Args:
            query_auth: If True, send credentials as query params instead of
                        HTTP Basic Auth (required for non-WC REST endpoints).
        """
        url = f"{self.base_url}/wp-json/{path}"
        effective_params = dict(params or {})
        auth = self.auth

        if query_auth:
            effective_params.update(self.auth_params)
            auth = None  # type: ignore[assignment]

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=method,
                url=url,
                params=effective_params or None,
                json=json_data,
                auth=auth,
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
