from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "DBM Materiales y Acabados"
    DATABASE_URL: str

    # Le decimos a Pydantic que lea las variables desde el archivo .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Instanciamos la configuración para usarla en toda la app
settings = Settings()