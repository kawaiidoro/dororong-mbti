"""Refresh inline CSP hashes and local JavaScript integrity after editing the site.

Run: python3 scripts/update_security.py
Check without modifying files: python3 scripts/update_security.py --check
Uses only the Python standard library.
"""
import base64
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / 'index.html'


def digest(data):
    return 'sha256-' + base64.b64encode(hashlib.sha256(data).digest()).decode('ascii')


def secured_html(source):
    inline = []
    def script(match):
        attrs, body = match.groups()
        external = re.search(r'\bsrc="\./([^"?]+)(?:\?[^\"]*)?"', attrs)
        if external:
            attrs = re.sub(r'\s+integrity="[^"]*"', '', attrs)
            path = (ROOT / external.group(1)).resolve()
            if path.parent != ROOT:
                raise ValueError('Script must be a root-level local file')
            attrs += f' integrity="{digest(path.read_bytes())}"'
        elif not re.search(r'\bsrc=', attrs):
            inline.append("'" + digest(body.encode('utf-8')) + "'")
        return f'<script{attrs}>{body}</script>'
    result = re.sub(r'<script([^>]*)>([\s\S]*?)</script>', script, source)
    policy = "; ".join([
        "default-src 'none'",
        "script-src 'self' " + ' '.join(inline),
        "script-src-attr 'none'",
        # The existing stylesheet and runtime theme/card styling are inline.
        "style-src 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "connect-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-src 'none'",
    ])
    csp = f'  <meta http-equiv="Content-Security-Policy" content="{policy}">'
    referrer = '  <meta name="referrer" content="no-referrer">'
    result = re.sub(r'^[ \t]*<meta http-equiv="Content-Security-Policy"[^>]*>\n', '', result, flags=re.M)
    result = re.sub(r'^[ \t]*<meta name="referrer"[^>]*>\n', '', result, flags=re.M)
    # Must precede all scripts, styles, images and links.
    result = result.replace('  <meta charset="utf-8">\n', '  <meta charset="utf-8">\n' + csp + '\n' + referrer + '\n', 1)
    return result


if __name__ == '__main__':
    source = INDEX.read_text()
    updated = secured_html(source)
    if '--check' in sys.argv:
        if updated != source:
            raise SystemExit('Security metadata is stale. Run python3 scripts/update_security.py')
        print('PASS: inline CSP hashes and local script integrity match the source files')
    else:
        INDEX.write_text(updated)
        print('Updated CSP hashes, script integrity, and referrer policy')
