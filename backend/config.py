from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- e-Stat API 設定 ---
    estat_app_id: str = ""
    estat_base_url: str = "https://api.e-stat.go.jp/rest/3.0/app/json"

    # --- Gemini Vision API 設定 ---
    gemini_api_base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"
    gemini_model_fallback: str = "gemini-1.5-pro"

    # --- Supabase 設定 ---
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Pydantic Settings の設定
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # 既存のコードとの互換性のためのプロパティ
    @property
    def APP_ID(self) -> str:
        return self.estat_app_id

    @property
    def ESTAT_BASE_URL(self) -> str:
        return self.estat_base_url

    @property
    def GEMINI_API_BASE_URL(self) -> str:
        return self.gemini_api_base_url

    @property
    def GEMINI_API_KEY(self) -> str:
        return self.gemini_api_key

    @property
    def GEMINI_MODEL(self) -> str:
        return self.gemini_model


settings = Settings()
