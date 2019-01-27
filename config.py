"""anna configuration parameters."""
DEBUG = True # Turns on debugging for Flask
VERSION = "0.0.2" # Version of anna
SECRET_KEY = "annassupersecret3000" # Secret key for sessions

BCRYPT_LOG_ROUNDS = 12 # Number of encryption rounds

SQLALCHEMY_DATABASE_URI = "sqlite://" # In memory database by default
SQLALCHEMY_TRACK_MODIFICATIONS = False # Disable event system

GOOGLE_ANALYTICS = "" # GA Code UA-###

# Default document css
DEFAULT_DOC_CSS = """.document {
  margin-bottom: 200px;
  background-color: white;
}"""
