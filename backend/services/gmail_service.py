import email as email_lib
import imaplib
import re
import smtplib
from datetime import datetime, timedelta
from email.header import decode_header
from email.utils import parsedate_to_datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List
from ..config import GMAIL_APP_PASSWORD, GMAIL_USER

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
NETWORK_TIMEOUT_SECONDS = 20


def send_email(to: str, subject: str, body: str, html: bool = False) -> bool:
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("[Gmail] Missing Gmail credentials")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = GMAIL_USER
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html" if html else "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=NETWORK_TIMEOUT_SECONDS) as server:
            server.ehlo()
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to, msg.as_string())
        return True
    except Exception as exc:
        print(f"[Gmail] Send error: {exc}")
        return False


def _extract_sender_email(raw_from: str) -> str:
    match = re.search(r"<([^>]+)>", raw_from or "")
    return (match.group(1) if match else raw_from or "").strip().lower()


def _extract_body(message) -> str:
    if message.is_multipart():
        html_body = ""
        for part in message.walk():
            content_type = part.get_content_type()
            payload = part.get_payload(decode=True)
            if not payload:
                continue
            decoded = payload.decode("utf-8", errors="replace")
            if content_type == "text/plain":
                return decoded
            if content_type == "text/html" and not html_body:
                html_body = decoded
        return html_body
    payload = message.get_payload(decode=True)
    return payload.decode("utf-8", errors="replace") if payload else ""


def _normalized_subject(subject: str) -> str:
    cleaned = (subject or "").strip()
    cleaned = re.sub(r"^(?:(?:re|fw|fwd)\s*:\s*)+", "", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip().lower()


def fetch_inbox(limit: int | None = 200, since_days: int = 90) -> List[dict]:
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("[Gmail] Missing Gmail credentials")
        return []

    emails = []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, timeout=NETWORK_TIMEOUT_SECONDS)
        mail.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        mail.select("INBOX", readonly=True)
        since_date = (datetime.utcnow() - timedelta(days=max(1, since_days))).strftime("%d-%b-%Y")
        status, msg_ids = mail.search(None, "SINCE", since_date)
        if status != "OK":
            _, msg_ids = mail.search(None, "ALL")
        all_ids = msg_ids[0].split()
        ids = all_ids if limit is None else all_ids[-limit:]
        if not ids:
            mail.logout()
            return emails

        _, msg_data = mail.fetch(b",".join(ids), "(RFC822)")
        messages = []
        for part in msg_data:
            if not isinstance(part, tuple) or len(part) != 2:
                continue
            _, payload = part
            if not payload:
                continue
            messages.append(email_lib.message_from_bytes(payload))

        for message in reversed(messages):

            subject, encoding = decode_header(message.get("Subject", ""))[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding or "utf-8", errors="replace")

            from_address = message.get("From", "")
            body = _extract_body(message)[:4000]
            emails.append(
                {
                    "from": from_address,
                    "from_email": _extract_sender_email(from_address),
                    "subject": subject,
                    "body": body,
                    "date": message.get("Date", ""),
                    "parsed_date": parsedate_to_datetime(message.get("Date", "")).isoformat() if message.get("Date", "") else "",
                    "message_id": message.get("Message-ID", ""),
                    "in_reply_to": message.get("In-Reply-To", ""),
                    "references": message.get("References", ""),
                    "thread_key": _normalized_subject(subject),
                }
            )

        mail.logout()
    except Exception as exc:
        print(f"[Gmail] Fetch error: {exc}")
    return emails
