#!/usr/bin/env python3
"""Serve Robot URDF Studio on your local network.

Run it from this folder, then open the address it prints. Your phone (on the same
Wi-Fi) can then open the QR link from the custom map dialog without GitHub Pages.
Live Android scanning still needs HTTPS (GitHub Pages); sending a scan file works here.
"""
import http.server
import os
import socket
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))  # no packet is sent; this just picks the Wi-Fi interface
        return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()


os.chdir(os.path.dirname(os.path.abspath(__file__)))
url = f'http://{lan_ip()}:{PORT}/'
print(f'Robot URDF Studio is running.\n\n  Open this on your computer:  {url}\n\nKeep this window open. Press Ctrl+C to stop.')
try:
    http.server.ThreadingHTTPServer(('0.0.0.0', PORT), http.server.SimpleHTTPRequestHandler).serve_forever()
except KeyboardInterrupt:
    pass
