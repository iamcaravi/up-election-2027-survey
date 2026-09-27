import urllib.request
import re

try:
    resp = urllib.request.urlopen("http://localhost:3000/uttar-pradesh")
    print("Status:", resp.status)
except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8", errors="ignore")
    with open("error_page.html", "w", encoding="utf-8") as f:
        f.write(body)
    print("Saved error_page.html")
    for m in re.finditer(r'(?:Error|Exception|failed):?\s*([^\n<]+)', body):
        print("Match:", m.group(0))
