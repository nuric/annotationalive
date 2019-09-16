"""Run annotation alive."""
from anna import socketio, app

# https://flask-socketio.readthedocs.io/en/latest/
# The flask run command introduced in Flask 0.11 can be used to start
# a Flask-SocketIO development server based on Werkzeug, but this method
# of starting the Flask-SocketIO server is not recommended due
# to lack of WebSocket support.
socketio.run(app, host='0.0.0.0', debug=False)
