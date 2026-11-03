#!/usr/bin/env python3
"""Create an etoolbox Pro licence key.

Usage:  python3 _build/make-pro-key.py customer@email.com [months]

Then add it in Cloudflare: Workers & Pages → KV → etoolbox-pro → Add entry
  Key:   the "KV key" printed below
  Value: the "KV value" printed below
Email the customer their Pro key. To cancel a key, edit its value and add "revoked": true.
"""
import json, secrets, sys, datetime

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I to avoid typos
email = sys.argv[1] if len(sys.argv) > 1 else ""
months = int(sys.argv[2]) if len(sys.argv) > 2 else 12
key = "ETB-" + "-".join("".join(secrets.choice(ALPHABET) for _ in range(4)) for _ in range(4))
expires = (datetime.date.today() + datetime.timedelta(days=round(months * 30.44))).isoformat()
print("Pro key (send to customer):", key)
print("KV key:  ", "key:" + key)
print("KV value:", json.dumps({"email": email, "plan": "pro", "expires": expires, "created": datetime.date.today().isoformat()}))
