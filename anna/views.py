"""Endpoints for the web application."""
import datetime

from flask import render_template, abort, redirect, url_for, request
from flask_login import login_user, login_required, current_user, logout_user
from flask_socketio import emit, join_room


from . import app, db, socketio
from .forms import UserPasswordForm
from .models import User, Document

@app.route('/login', methods=['GET', 'POST'])
def login():
  """Login user if not already logged in."""
  form = UserPasswordForm()
  if form.validate_on_submit():
    # For convenience we create users while they login
    user = User.query.filter_by(username=form.username.data).first()
    if user:
      if user.is_correct_password(form.password.data):
        login_user(user)
        user.last_login = datetime.datetime.now()
        db.session.commit()
        return redirect(url_for('index'))
      return redirect(url_for('login'))
    # Create new user
    user = User(username=form.username.data, password=form.password.data)
    db.session.add(user)
    db.session.commit()
    login_user(user)
    app.logger.info("New user: %s", user.username)
    return redirect(url_for('index'))
  return render_template('login.html', form=form)

def rows_to_dicts(objs, attributes):
  """Convert SQLAlchemy object to dictionary."""
  l = list()
  for obj in objs:
    d = dict()
    for att in attributes:
      elem = getattr(obj, att, None)
      d[att] = elem
      if elem is not None and isinstance(elem, datetime.datetime):
        d[att] = elem.isoformat()
    l.append(d)
  return l

@app.route('/')
@login_required
def index():
  """Index page."""
  return render_template('index.html', docs=Document.query.all())

@app.route('/new/<docname>')
@login_required
def new_document(docname):
  """Create a new document with given name."""
  # Check if user is admin
  if not current_user.is_admin:
    abort(401)
  # Check if already exists
  doc = Document.query.filter_by(name=docname).first()
  if not doc:
    doc = Document(user_id=current_user.id, name=docname)
    db.session.add(doc)
    db.session.commit()
  return redirect(url_for('document', docid=doc.id))

@app.route('/d/<int:docid>')
@login_required
def document(docid):
  """Document page."""
  doc = Document.query.get_or_404(docid)
  return render_template('document.html', doc=doc)

@socketio.on('connect')
def handle_connect():
  """Handle incoming websocket connection."""
  if not current_user.is_authenticated:
    return False
  docid = request.args.get('docid', type=int)
  if docid and docid != -1:
    doc = Document.query.get(docid)
    if doc is not None:
      join_room(doc.id)
      emit('document', doc.content)
  else:
    join_room(-1)
  return True

@socketio.on('chat')
def handle_chat(json):
  """Handle incoming chat messages."""
  docid = request.args.get('docid', type=int)
  emit('chat', json, room=docid)

@socketio.on('document')
def handle_doc_update(content):
  """Handle incoming chat messages."""
  docid = request.args.get('docid', type=int)
  doc = Document.query.get_or_404(docid)
  if current_user and current_user.id == doc.user_id:
    doc.content = content
    doc.updated = datetime.datetime.now()
    db.session.commit()
    emit('document', content, room=docid)

def reset_account():
  """Reset current active account."""
  app.logger.info("Reset user: %s", current_user.username)
  return redirect(url_for('index'))

def delete_account():
  """Delete current active account."""
  user = User.query.get(current_user.id)
  logout_user()
  db.session.delete(user)
  db.session.commit()
  app.logger.info("Delete user: %s", user.username)
  return redirect(url_for('login'))

def account_handler(action):
  """Handle account actions."""
  form = UserPasswordForm()
  if form.validate_on_submit():
    # Check username and password again
    if (form.username.data == current_user.username and
        current_user.is_correct_password(form.password.data)):
      # Perform requests account action
      if action == "account_reset":
        return reset_account()
      if action == "account_delete":
        return delete_account()
    return redirect(url_for(action))
  return render_template('account.html', form=form,
                         form_header=action.replace('_', ' ').title())

@app.route('/account_reset', methods=['GET', 'POST'])
@login_required
def account_reset():
  """Handler for account reset."""
  return account_handler("account_reset")

@app.route('/account_delete', methods=['GET', 'POST'])
@login_required
def account_delete():
  """Handler for account delete."""
  return account_handler("account_delete")

@app.route('/logout')
def logout():
  """Logout and redirect user."""
  logout_user()
  return redirect(url_for('login'))
