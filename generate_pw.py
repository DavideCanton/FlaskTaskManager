__author__ = 'Kami'

from hashlib import sha256
from getpass import getpass

if __name__ == "__main__":
    username = raw_input("Username: ")
    password = getpass()
    with open("hash.tmp", "wb") as f:
        f.write(username)
        f.write("\n")
        f.write(sha256(password).digest())