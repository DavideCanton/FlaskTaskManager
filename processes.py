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

import signal
from socket import gethostname
import os

import psutil


SIGNALS = {getattr(signal, name): name
           for name in ["SIGINT", "SIGCONT", "SIGSTOP", "SIGHUP",
                        "SIGKILL", "SIGTERM", "SIGUSR1", "SIGUSR2"]
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