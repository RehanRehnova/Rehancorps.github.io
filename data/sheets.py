"""
Google Sheets for Passfill reviews — same pattern as securiti (logic.py).

Config (any of these):
  .env:
    SPREADSHEET_ID=...
    GOOGLE_SERVICE_ACCOUNT_JSON={...}   # optional if credentials.json exists
    PASSFILL_SHEET_NAME=Reviews

  Project root:
    credentials.json     — service account file
    spreadsheet_id.txt   — one line: the sheet ID (if no .env)

Share the Google Sheet with the service account email as Editor.
"""
from __future__ import annotations

import json
import os
import re
from datetime import datetime

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load .env from project root even if cwd differs
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv()  # also cwd

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
HEADERS = ["Timestamp", "Name", "Rating", "Body", "Status"]


def _read_spreadsheet_id():
    sid = (
        os.getenv("SPREADSHEET_ID", "")
        or os.getenv("GOOGLE_SPREADSHEET_ID", "")
        or os.getenv("SHEETS_ID", "")
    ).strip()
    if sid:
        return sid
    for name in ("spreadsheet_id.txt", "SPREADSHEET_ID.txt"):
        path = os.path.join(BASE_DIR, name)
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    line = f.read().strip().splitlines()[0].strip()
                if line and not line.startswith("#"):
                    return line
            except OSError:
                pass
    return ""


def _credentials_json_path():
    for name in ("credentials.json", "service_account.json", "google-credentials.json"):
        path = os.path.join(BASE_DIR, name)
        if os.path.isfile(path):
            return path
    return ""


def _service_account_env():
    return (
        os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
        or os.getenv("GOOGLE_CREDENTIALS_JSON", "")
        or ""
    ).strip()


def sheet_name():
    return (os.getenv("PASSFILL_SHEET_NAME", "Reviews") or "Reviews").strip() or "Reviews"


def config_status():
    """What is missing — for debugging 503s."""
    sid = _read_spreadsheet_id()
    env_json = bool(_service_account_env())
    file_json = _credentials_json_path()
    return {
        "spreadsheet_id": bool(sid),
        "spreadsheet_id_preview": (sid[:8] + "…") if len(sid) > 8 else sid,
        "service_account_env": env_json,
        "credentials_file": bool(file_json),
        "credentials_path": file_json or None,
        "sheet_name": sheet_name(),
        "configured": bool(sid) and (env_json or bool(file_json)),
    }


def sheets_configured():
    return config_status()["configured"]


def get_sheets_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    raw = _service_account_env()
    if raw:
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=SCOPES
        )
    else:
        path = _credentials_json_path()
        if not path:
            raise FileNotFoundError(
                "No credentials: set GOOGLE_SERVICE_ACCOUNT_JSON or put credentials.json in project root"
            )
        creds = service_account.Credentials.from_service_account_file(
            path, scopes=SCOPES
        )
    return build("sheets", "v4", credentials=creds)


def _spreadsheet_id():
    sid = _read_spreadsheet_id()
    if not sid:
        raise ValueError(
            "SPREADSHEET_ID missing. Add to .env or spreadsheet_id.txt in project root."
        )
    return sid


def _ensure_sheet_tab(service, title):
    ssid = _spreadsheet_id()
    meta = service.spreadsheets().get(spreadsheetId=ssid).execute()
    titles = [s["properties"]["title"] for s in meta.get("sheets", [])]
    if title in titles:
        return
    service.spreadsheets().batchUpdate(
        spreadsheetId=ssid,
        body={"requests": [{"addSheet": {"properties": {"title": title}}}]},
    ).execute()


def _ensure_headers(service):
    from googleapiclient.errors import HttpError

    ssid = _spreadsheet_id()
    name = sheet_name()
    try:
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=ssid, range=f"'{name}'!A1:E1")
            .execute()
        )
        existing = result.get("values", [])
    except HttpError as e:
        msg = str(e)
        if e.resp is not None and e.resp.status in (400, 404) or "Unable to parse range" in msg:
            _ensure_sheet_tab(service, name)
            existing = []
        else:
            raise

    if not existing or list(existing[0][:5]) != HEADERS:
        service.spreadsheets().values().update(
            spreadsheetId=ssid,
            range=f"'{name}'!A1",
            valueInputOption="RAW",
            body={"values": [HEADERS]},
        ).execute()


def append_review(name: str, rating: int, body: str, status: str = "approved"):
    st = config_status()
    if not st["configured"]:
        missing = []
        if not st["spreadsheet_id"]:
            missing.append("SPREADSHEET_ID (.env or spreadsheet_id.txt)")
        if not st["service_account_env"] and not st["credentials_file"]:
            missing.append("credentials.json or GOOGLE_SERVICE_ACCOUNT_JSON")
        return False, "Sheets not configured — missing: " + ", ".join(missing)

    name = (name or "Anon").strip()[:40] or "Anon"
    body = (body or "").strip()[:800]
    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return False, "invalid rating"
    if rating < 1 or rating > 5:
        return False, "rating must be 1–5"
    if len(body) < 4:
        return False, "feedback too short"

    if not re.match(r"^[\w\s.\-]{1,40}$", name, re.UNICODE):
        name = "Anon"

    try:
        service = get_sheets_service()
        sn = sheet_name()
        _ensure_sheet_tab(service, sn)
        _ensure_headers(service)
        row = [
            datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            name,
            str(rating),
            body,
            status or "approved",
        ]
        service.spreadsheets().values().append(
            spreadsheetId=_spreadsheet_id(),
            range=f"'{sn}'!A:E",
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={"values": [row]},
        ).execute()
        return True, None
    except Exception as e:
        print(f"append_review error: {e}")
        return False, str(e)


def fetch_reviews(include_pending=False):
    if not sheets_configured():
        return []

    try:
        service = get_sheets_service()
        sn = sheet_name()
        _ensure_sheet_tab(service, sn)
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=_spreadsheet_id(), range=f"'{sn}'!A2:E")
            .execute()
        )
        rows = result.get("values", []) or []
    except Exception as e:
        print(f"fetch_reviews error: {e}")
        return []

    out = []
    for row in rows:
        while len(row) < 5:
            row.append("")
        ts, name, rating_s, body, status = row[0], row[1], row[2], row[3], row[4]
        status_l = (status or "approved").strip().lower()
        if status_l == "rejected":
            continue
        if status_l == "pending" and not include_pending:
            continue
        if status_l and status_l not in ("approved", "pending", ""):
            continue
        try:
            rating = int(float(str(rating_s).strip() or 0))
        except ValueError:
            rating = 0
        rating = max(0, min(5, rating))
        body = (body or "").strip()
        if not body:
            continue
        out.append(
            {
                "name": (name or "Anon").strip()[:40] or "Anon",
                "rating": rating,
                "body": body[:800],
                "date": (ts or "")[:19],
                "status": status_l or "approved",
            }
        )
    out.reverse()
    return out
