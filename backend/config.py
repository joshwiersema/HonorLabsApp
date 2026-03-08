from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "Honor Labs API"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True

    # WooCommerce credentials
    wc_site_url: str = ""
    wc_consumer_key: str = ""
    wc_consumer_secret: str = ""

    # JWT
    jwt_secret: str = "honor-labs-dev-secret-change-in-prod"
    jwt_expiry_hours: int = 72

    # Users JSON
    app_users: str = "[]"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
