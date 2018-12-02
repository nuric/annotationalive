"""pedlarweb data models."""
import datetime
from . import bcrypt, db, login_manager, app


class User(db.Model):
  """Single user instance."""
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  username = db.Column(db.String(128), unique=True, nullable=False)
  _password = db.Column("password", db.String(128), nullable=False)
  is_admin = db.Column(db.Boolean(), nullable=False, default=False)
  last_login = db.Column(db.DateTime(), nullable=False, default=datetime.datetime.now)
  joined = db.Column(db.DateTime(), nullable=False, default=datetime.datetime.now)

  @property
  def password(self):
    """Hashed user password."""
    return self._password

  @password.setter
  def password(self, plaintext):
    self._password = bcrypt.generate_password_hash(plaintext)

  def is_correct_password(self, plaintext):
    """Check plaintext password against hash.
    :return: true if correct false otherwise
    """
    return bcrypt.check_password_hash(self._password, plaintext)

  @property
  def is_active(self):
    """Is user active?"""
    return True

  @property
  def is_authenticated(self):
    """Is user authenticated?"""
    return True

  @property
  def is_anonymous(self):
    """Is it an anonymous user?"""
    return False

  def get_id(self):
    """Return unique user id."""
    return str(self.id)

# Handle Flask-Login loading
@login_manager.user_loader
def load_user(user_id):
  """Load User entry using given user_id"""
  return User.query.get(user_id)


class Document(db.Model):
  """Single trade order."""
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
  name = db.Column(db.String(48), unique=True, nullable=False)
  content = db.Column(db.Text(), default="", nullable=False)
  updated = db.Column(db.DateTime(), nullable=False, default=datetime.datetime.now)
  created = db.Column(db.DateTime(), nullable=False, default=datetime.datetime.now)

  @property
  def is_empty(self):
    """Is the order still open?"""
    return not bool(self.content)

  def __len__(self):
    return len(self.content)

# Check for in memory database
if app.config['SQLALCHEMY_DATABASE_URI'] == "sqlite://":
  db.create_all()
