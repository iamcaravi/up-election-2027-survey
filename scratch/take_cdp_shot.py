import subprocess
import time
import json
import urllib.request
import socket
import base64
import os

def capture_page(url, width, height, out_path, is_mobile=False):
    edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    proc = subprocess.Popen([
        edge,
        '--headless=new',
        '--remote-debugging-port=9245',
        '--disable-gpu',
        url
    ])
    time.sleep(3)
    try:
        tabs = json.loads(urllib.request.urlopen('http://localhost:9245/json').read().decode())
        target = next((t for t in tabs if 'localhost:3000' in t.get('url', '')), tabs[0])
        ws_url = target['webSocketDebuggerUrl']
        path = ws_url.split('localhost:9245')[1]

        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('localhost', 9245))
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: localhost:9245\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
            f"Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(req.encode('latin1'))
        s.recv(1024)

        def send_cdp(method, params, msg_id=1):
            payload = json.dumps({'id': msg_id, 'method': method, 'params': params})
            msg = payload.encode('utf-8')
            frame = bytearray([0x81])
            length = len(msg)
            if length <= 125:
                frame.append(0x80 | length)
            elif length <= 65535:
                frame.append(0x80 | 126)
                frame.extend(length.to_bytes(2, 'big'))
            mask = b'\x12\x34\x56\x78'
            frame.extend(mask)
            masked = bytearray(b ^ mask[i % 4] for i, b in enumerate(msg))
            frame.extend(masked)
            s.sendall(frame)

        # 1. Device metrics
        send_cdp('Emulation.setDeviceMetricsOverride', {
            'width': width,
            'height': height,
            'deviceScaleFactor': 1,
            'mobile': is_mobile
        }, 1)
        s.recv(2048)
        time.sleep(1.5)

        # 2. Capture Screenshot
        send_cdp('Page.captureScreenshot', {
            'format': 'png',
            'clip': {
                'x': 0,
                'y': 0,
                'width': width,
                'height': height,
                'scale': 1
            },
            'captureBeyondViewport': True
        }, 2)

        # Receive data in buffer
        buf = bytearray()
        s.settimeout(12.0)
        while True:
            try:
                chunk = s.recv(65536)
                if not chunk:
                    break
                buf.extend(chunk)
                if b'"data":"' in buf and buf.endswith(b'"}'):
                    break
                if b'"data":"' in buf and b'"}}}' in buf:
                    break
            except socket.timeout:
                break

        # Decode
        s_str = buf.decode('utf-8', errors='ignore')
        parts = s_str.split('"data":"')
        if len(parts) > 1:
            b64 = parts[1].split('"')[0]
            with open(out_path, 'wb') as f:
                f.write(base64.b64decode(b64))
            print("Successfully captured screenshot:", out_path)
        else:
            print("Failed to find image data in response")

    finally:
        proc.terminate()

if __name__ == '__main__':
    base_dir = r'C:\Users\Manoj Mishra\.gemini\antigravity\brain\bd8a41c1-2d86-474f-83ee-ea0c89705809\.user_uploaded'
    mob_path = os.path.join(base_dir, 'final_matched_mobile.png')
    capture_page('http://localhost:3000/uttar-pradesh', 390, 2200, mob_path, is_mobile=True)

    time.sleep(2)
    desk_path = os.path.join(base_dir, 'final_matched_desktop.png')
    capture_page('http://localhost:3000/uttar-pradesh', 1280, 1400, desk_path, is_mobile=False)
