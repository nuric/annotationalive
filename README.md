# :memo: Annotation Alive
ANNotatioN Alive is a minimal tool for live markdown editing. It is designed for a lecture, presentation environment. It assumes there is one editor and many viewers. The idea is to build an extensible platform covering fundamentals such as socket connections so that it can customised heavily afterwards for the specific use case.

![screenshot](https://github.com/nuric/annotationalive/raw/master/anna_screenshot.jpg)

## Getting Started
Since it is a minimal platform, there aren't much back-end dependencies. It is built using [Flask](http://flask.pocoo.org/) on the backend and all the dependencies can be installed using:

```bash
git clone https://github.com/nuric/annotationalive.git
cd annotationalive
pip3 install --no-cache-dir --upgrade -r requirements.txt
```

After the packages are installed, it can be run with the following commands:

```bash
export FLASK_APP=anna
export FLASK_ENV=production # or development
flask run
# Visit localhost:5000
```
Key things to consider before and after running:
 - For convenience **a new account is created if one doesn't exist** to minimise friction on getting people on the platform.
 - However, there is no default admin and no mechanism to nominate an admin from the app. So **manually in the database one account needs to be set to be admin** such that new documents can be created.
 - To create a new document follow `/d/<document_name>` as path and if the user is an admin it will create a new document, others will be redirected to the existing document.

## Limitations
The app is designed to be minimal and doesn't come with some, perhaps expected, features:
 - It assumes there only one editor. The entire document is sent as the update not incremental changes.
 - There is no full CRUD on documents or user accounts. No password change, no document delete etc. But there is structure such as account reset left as a starting point.
 - Chat is ephemeral, it doesn't store a history so on a page refresh it will start clean and only render newly received messages.

## FAQ
 - **Why is the source code 2 space indented?** The answer is a combination of personal style and to stop direct copy-paste from other resources. The code is linted using [PyLint](https://www.pylint.org/) although there are cases it is disabled on purpose.
 - **Why are the document updates not instant?** There is a 500ms debounce delay so it accumulates changes and then sends the final state of the document in order to reduce network traffic.

## Contributing
Bug fixes and small improvements following the existing design principle are welcome. You are encouraged to fork and customise for your use case. Some initial ideas are:
 - Add syntax highlighting for code blocks
 - Adjustable themes for the markdown document
 - Provide support for full CRUD on document objects

## Built With
 - [Flask](http://flask.pocoo.org/) - web framework
 - [SocketIO](https://socket.io/) - server client messaging for dynamic updates
 - [Vue.JS](https://vuejs.org/) - dynamic front-end rendering
 - [W3.CSS](https://www.w3schools.com/w3css/) - front-end CSS library
 - [markdown-it](https://github.com/markdown-it/markdown-it) - markdown renderer
