# Copyright (c) 2014, Davide Canton
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
# 1. Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
# notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
# 3. All advertising materials mentioning features or use of this software
#    must display the following acknowledgement:
#    This product includes software developed by the <organization>.
# 4. Neither the name of the <organization> nor the
#    names of its contributors may be used to endorse or promote products
#    derived from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ''AS IS'' AND ANY
# EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
# DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
# ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

__author__ = 'Davide Canton'

import sys

from flask import Flask, jsonify, request, redirect, url_for, flash, \
    render_template
from flask_login import LoginManager, login_user, login_required, logout_user, \
    current_user

import user
import processes

app = Flask(__name__)
app.config["SECRET_KEY"] = (u'I\x9d\x8e\x1e[*!gAlD_3\x08P]\xad'
                            u'\x98n\x8f\x1bO?!T^Z\x80:')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "index"


@login_manager.user_loader
def load_user(userid):
    return user.User(userid)


@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("proc_list"))
    ctx = {"machine_name": processes.get_data()["machine_name"]}
    return render_template("index.html", **ctx)


@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]
    curuser = user.User(username, password)
    if app.config["CREDENTIALS"].validate_user(curuser):
        login_user(curuser)
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
@login_required
def proc_list():
    ctx = {"processes": processes.get_processes(),
           "signals": processes.get_available_signals()}
    return render_template("proc_list.html", **ctx)


@app.route("/credits")
def credits_view():
    return render_template("credits.html")


@app.route("/proc_info", methods=["GET"])
@login_required
def proc_info():
    p = processes.get_processes()
    return jsonify(data=p)


@app.route("/platform_info", methods=["GET"])
@login_required
def platform_info():
    data = processes.get_data()
    return jsonify(data=data)


@app.route("/kill", methods=["POST"])
@login_required
def kill():
    proc_id = request.form["pid"]
    signum = request.form["signum"]
    res = processes.kill_proc(int(proc_id), int(signum))
    if res:
        return "Errore: {}".format(res)
    else:
        return "Operazione terminata con successo!"


def main():
    if len(sys.argv) > 1:
        host = sys.argv[1]
        port = int(sys.argv[2])
        debug = False
    else:
        debug = True
        host = "localhost"
        # host = "0.0.0.0"
        port = 8000

    try:
        c = user.load_credentials()
        app.config["CREDENTIALS"] = c
        app.run(debug=bool(debug), host=host, port=port)
    except IOError:
        print("Cannot load login data.", file=sys.stderr)

        
if __name__ == "__main__":
    main()