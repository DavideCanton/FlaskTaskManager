from flask.helpers import flash

__author__ = 'Kami'

from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_login import LoginManager, login_user, login_required, logout_user, \
    current_user
from user import User, load_credentials
from decorators import templated
from processes import get_processes, get_data, kill_proc, get_available_signals
import sys

app = Flask(__name__)
app.config["SECRET_KEY"] = (u'I\x9d\x8e\x1e[*!gAlD_3\x08P]\xad'
                            u'\x98n\x8f\x1bO?!T^Z\x80:')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "index"


@login_manager.user_loader
def load_user(userid):
    return User(userid)


@app.route("/")
@templated()
def index():
    if current_user.is_authenticated():
        return redirect(url_for("proc_list"))
    machine_name = get_data()["machine_name"]
    return {"machine_name": machine_name}


@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]
    user = User(username, password)
    if app.config["CREDENTIALS"].validate_user(user):
        login_user(user)
        return redirect(url_for("proc_list"))
    flash("Login non valido!")
    return redirect(url_for("index"))


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logout effettuato con successo!")
    return redirect(url_for("index"))


@app.route("/proc_list")
@templated()
@login_required
def proc_list():
    return {"processes": get_processes(),
            "signals": get_available_signals()}


@app.route("/credits")
@templated("credits.html")
def credits_view():
    return {}


@app.route("/proc_info", methods=["GET"])
@login_required
def proc_info():
    processes = get_processes()
    return jsonify(data=processes)


@app.route("/platform_info", methods=["GET"])
@login_required
def platform_info():
    data = get_data()
    return jsonify(data=data)


@app.route("/kill", methods=["POST"])
@login_required
def kill():
    proc_id = request.form["pid"]
    signum = request.form["signum"]
    res = kill_proc(int(proc_id), int(signum))
    if res:
        return "Errore: {}".format(res)
    else:
        return "Operazione terminata con successo!"


if __name__ == "__main__":
    if len(sys.argv) > 1:
        host = sys.argv[1]
        debug = sys.argv[2]
    else:
        debug = True
        # host = "localhost"
        host = "0.0.0.0"

    try:
        c = load_credentials()
        app.config["CREDENTIALS"] = c
        app.run(debug=bool(debug), host=host)
    except IOError:
        print >> sys.stderr, "Cannot load login data."