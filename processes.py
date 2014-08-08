__author__ = 'Kami'

import psutil
import signal
from jinja2.filters import do_filesizeformat
from socket import gethostname
import os

SIGNALS = ["SIGINT", "SIGCONT", "SIGSTOP", "SIGHUP", "SIGKILL", "SIGTERM",
           "SIGUSR1", "SIGUSR2"]
SIGNALS = {getattr(signal, name): name
           for name in SIGNALS
           if hasattr(signal, name)}


def r2(n):
    return round(n, ndigits=2)


def get_processes():
    buf = []
    for proc in psutil.process_iter():
        try:
            if proc.name() is not None:
                times = proc.cpu_times()
                data = [proc.name(), proc.pid, proc.ppid(),
                        proc.cpu_percent(), proc.memory_info()[0],
                        r2(times[0]), r2(times[1]),
                        " ".join(proc.cmdline())]
                buf.append(data)
        except psutil.AccessDenied:
            pass
    return buf


def get_data():
    mem = psutil.virtual_memory()
    return {"machine_name": gethostname(),
            "cpu_num": psutil.cpu_count(logical=False) or 1,
            "cpu_percent": psutil.cpu_percent(),
            "total_mem": mem.total,
            "available_mem": mem.available,
            "percent_mem": mem.percent}


def kill_proc(pid, signum):
    if signum not in SIGNALS:
        return "Unsupported signal with code {}".format(signum)
    try:
        os.kill(pid, signum)
        return None
    except Exception as e:
        return str(e)


def get_available_signals():
    return SIGNALS


if __name__ == "__main__":
    print(get_available_signals())