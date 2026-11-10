"""Install local Piston GCC and enable pthread linking for repo exercises.

Run with the project Python after starting the local piston_api container.
The compiler wrapper lives in Piston's persistent package volume.
"""
import re
import subprocess

import httpx


def configure():
    base = "http://127.0.0.1:2000/api/v2"
    with httpx.Client(timeout=180) as client:
        runtimes = client.get(base + "/runtimes").raise_for_status().json()
        cpp = next((r for r in runtimes if r["language"] == "c++"), None)
        if cpp is None:
            client.post(base + "/packages", json={"language": "gcc", "version": "10.2.0"}).raise_for_status()
            runtimes = client.get(base + "/runtimes").raise_for_status().json()
            cpp = next(r for r in runtimes if r["language"] == "c++")
    version = cpp["version"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise RuntimeError("Unexpected GCC version")
    path = f"/piston/packages/gcc/{version}/compile"
    existing = subprocess.check_output(["docker", "exec", "piston_api", "cat", path])
    source = existing.decode().replace("\r\n", "\n")
    original = "g++ -std=c++17 *.cpp"
    configured = "g++ -std=c++17 -pthread *.cpp"
    if configured not in source:
        if original not in source:
            raise RuntimeError("Compiler wrapper changed; inspect it before configuring")
        source = source.replace(original, configured)
    if source.encode() != existing:
        subprocess.run(["docker", "exec", "-i", "piston_api", "tee", path], input=source.encode(), stdout=subprocess.DEVNULL, check=True)
    print(f"Piston C++ {version} ready with C++17 and pthread support")


if __name__ == "__main__":
    configure()
