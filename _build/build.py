"""Generates the static HTML pages for etoolbox.co.uk into the repo."""
import os
here = os.path.dirname(os.path.abspath(__file__))
G = {}
exec(open(os.path.join(here, "core.py")).read(), G)
G["OUT"] = os.path.dirname(here)  # site root = repo root
for part in ("qr_pages.py", "tools_pages.py", "tools2_pages.py", "tools3_pages.py", "tools4_pages.py", "tools5_pages.py", "tools6_pages.py", "tools7_pages.py",
             "home_page.py", "rest_pages.py"):
    exec(open(os.path.join(here, part)).read(), G)
G["write_index"]()
G["build_sprite"](os.path.join(here, "lucide"))
