# Manda código Python para o Blender aberto (addon Blender MCP, porta 9876) e mostra o resultado.
# Vários arquivos são concatenados na ordem (ex.: lib.py + script.py).
import json, socket, sys
def send(cmd):
    s = socket.create_connection(("127.0.0.1", 9876), timeout=900)
    s.sendall(json.dumps(cmd).encode())
    buf = b""
    while True:
        chunk = s.recv(65536)
        if not chunk: break
        buf += chunk
        try: return json.loads(buf.decode())
        except ValueError: continue
    return json.loads(buf.decode())
if __name__ == "__main__":
    code = "\n".join(open(f, encoding="utf-8").read() for f in sys.argv[1:]) if len(sys.argv) > 1 else sys.stdin.read()
    r = send({"type": "execute_code", "params": {"code": code}})
    res = r.get("result", r)
    print(res.get("result", res) if isinstance(res, dict) else res)
