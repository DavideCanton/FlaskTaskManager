__author__ = 'Kami'

from hashlib import sha256
import os.path as osp

from flask_login import UserMixin


class Credentials:
    def __init__(self, username, password):
        self.username = username
        self.password = password

    def validate_user(self, user):
        return user.get_id() == self.username and user.password == self.password


def load_credentials():
    path, _ = osp.split(__file__)
    with open(osp.join(path, "hash.tmp"), "rb") as f:
        username = f.readline().strip()
        password = f.read()
    return Credentials(username, password)


class User(UserMixin):
    def __init__(self, username, password=None):
        self.id = username
        if password is not None:
            self.password = sha256(password).digest()
