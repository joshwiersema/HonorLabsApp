import os

from pydantic import BaseModel


class Credentials(BaseModel):
    site_url: str
    consumer_key: str
    consumer_secret: str


class AppState:
    """WooCommerce credentials from environment variables."""

    @property
    def credentials(self) -> Credentials | None:
        url = os.environ.get("WC_SITE_URL", "")
        key = os.environ.get("WC_CONSUMER_KEY", "")
        secret = os.environ.get("WC_CONSUMER_SECRET", "")
        if url and key and secret:
            return Credentials(site_url=url, consumer_key=key, consumer_secret=secret)
        return None

    @property
    def is_connected(self) -> bool:
        return self.credentials is not None


app_state = AppState()
