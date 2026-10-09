#!/usr/bin/env python3
"""
InvertisPrep — bulk email campaign sender (Amazon SES over SMTP).
================================================================

Sends ONE personalized HTML template to every active user in MongoDB, from
no-reply@invertisprep.in, via SES's SMTP interface. Run it from your Mac.

WHY SMTP AND NOT boto3: SES SMTP only needs the stdlib (smtplib) + the SMTP
credentials from the SES console — no boto3, no AWS keys on disk. Port 587 is
used (port 25 is blocked by ISPs/AWS).

CREDENTIALS / CONFIG — set these as environment variables before running
(the script also loads a `.env` file sitting next to it, if present):

    MONGODB_URI      MongoDB connection string (same one the API uses)
    DB_NAME          optional — database name if the URI doesn't include it
    SMTP_HOST        email-smtp.ap-south-1.amazonaws.com   (your SES region)
    SMTP_PORT        587
    SMTP_USER        SES SMTP username  (from SES → SMTP settings)
    SMTP_PASS        SES SMTP password  (from SES → SMTP settings)
    MAIL_FROM        "InvertisPrep <no-reply@invertisprep.in>"
    REPLY_TO         support@invertisprep.in

Never commit these. `.env` is gitignored.

USAGE:
    # 1) See how many recipients + a preview, send nothing (SAFE, start here)
    python3 send_bulk_email.py --dry-run

    # 2) Send one real email to yourself and confirm it looks right
    python3 send_bulk_email.py --test you@gmail.com

    # 3) Send to the first 25 real users (limit while validating)
    python3 send_bulk_email.py --limit 25

    # 4) Full campaign (asks for confirmation first unless --yes)
    python3 send_bulk_email.py --yes

Rate: SES grants 14 emails/sec on this account. The default --rate 10 leaves
headroom; a 3,400-user send then takes ~6 minutes. Keep the Mac awake:
    caffeinate -i python3 send_bulk_email.py --yes

Flags:
    --dry-run        List recipients + preview the first email; send nothing.
    --test EMAIL     Send a single test to EMAIL (bypasses the user list).
    --limit N        Only send to the first N users.
    --rate N         Max emails per second (default 10).
    --subject TEXT   Override the subject line.
    --template PATH  HTML template file (default: email_template.html).
    --yes            Skip the interactive confirmation.
    --failures-csv F Write failed addresses to CSV (default: failed_sends.csv).
"""

import argparse
import csv
import os
import smtplib
import ssl
import sys
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TEMPLATE = os.path.join(HERE, "email_template.html")
DEFAULT_SUBJECT = "InvertisPrep — Important update for your account"


# ── tiny .env loader (no dependency) ─────────────────────────────────────────
def load_dotenv(path):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            # real environment wins over .env
            os.environ.setdefault(key, value)


load_dotenv(os.path.join(HERE, ".env"))


def env(name, required=True, default=None):
    value = os.environ.get(name, default)
    if required and not value:
        print(f"✗ Missing required env var: {name}")
        sys.exit(1)
    return value


# ── template rendering ───────────────────────────────────────────────────────
def render(template_text, context):
    """Replace {{key}} placeholders with values; leaves unknown keys as-is."""
    out = template_text
    for key, value in context.items():
        out = out.replace("{{" + key + "}}", str(value))
    return out


def html_to_text(html):
    """Crude HTML→text fallback for the plain-text part (good enough for email)."""
    import re

    text = re.sub(r"(?is)<(script|style).*?>.*?</\1>", "", html)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ── DB fetch ────────────────────────────────────────────────────────────────
def fetch_recipients(limit=None):
    """Active users with a usable email, deduped case-insensitively."""
    try:
        from pymongo import MongoClient
    except ImportError:
        print("✗ pymongo is not installed. Run:  pip3 install pymongo")
        sys.exit(1)

    uri = env("MONGODB_URI")
    db_name = os.environ.get("DB_NAME") or None

    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    db = client[db_name] if db_name else client.get_default_database()
    print(f"🔌 Connected to MongoDB → database: {db.name}")

    query = {
        "email": {"$exists": True, "$ne": ""},
        # Only active accounts; comment out the next line to mail everyone.
        "isActive": True,
    }

    seen = set()
    recipients = []
    cursor = db.users.find(query, {"email": 1, "name": 1}).sort("_id", 1)
    for doc in cursor:
        email = (doc.get("email") or "").strip()
        low = email.lower()
        if not email or "@" not in email or low in seen:
            continue
        seen.add(low)
        name = (doc.get("name") or "").strip() or "there"
        recipients.append({"email": email, "name": name})
        if limit and len(recipients) >= limit:
            break

    client.close()
    return recipients


# ── sending ─────────────────────────────────────────────────────────────────
def build_message(from_hdr, reply_to, to_email, to_name, subject, html, text):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_hdr
    msg["To"] = formataddr((to_name, to_email))
    msg["Reply-To"] = reply_to
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="invertisprep.in")
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def connect_smtp(host, port, user, password):
    context = ssl.create_default_context()
    server = smtplib.SMTP(host, port, timeout=30)
    server.ehlo()
    server.starttls(context=context)
    server.ehlo()
    server.login(user, password)
    return server


def send_campaign(recipients, args, template_html, subject, from_hdr, reply_to):
    host = env("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = env("SMTP_USER")
    password = env("SMTP_PASS")

    delay = 1.0 / max(args.rate, 1)
    server = connect_smtp(host, port, user, password)
    print(f"✉️  Connected to {host}:{port} — sending at ≤{args.rate}/sec\n")

    sent, failed = 0, []
    failures_csv = args.failures_csv

    try:
        for i, r in enumerate(recipients, 1):
            html = render(template_html, {"name": r["name"], "email": r["email"]})
            text = html_to_text(html)
            msg = build_message(
                from_hdr, reply_to, r["email"], r["name"], subject, html, text
            )
            try:
                server.sendmail(from_hdr_addr(from_hdr), [r["email"]], msg.as_string())
                sent += 1
                print(f"  ✓ [{i}/{len(recipients)}] {r['email']}")
            except (smtplib.SMTPServerDisconnected, smtplib.SMTPException) as exc:
                # SES drops idle connections — reconnect once, then retry.
                print(f"  ↻ reconnect ({exc}); retrying {r['email']}")
                try:
                    server = connect_smtp(host, port, user, password)
                    server.sendmail(from_hdr_addr(from_hdr), [r["email"]], msg.as_string())
                    sent += 1
                    print(f"  ✓ [{i}/{len(recipients)}] {r['email']} (after retry)")
                except Exception as exc2:  # noqa: BLE001
                    failed.append((r["email"], str(exc2)))
                    print(f"  ✗ {r['email']}: {exc2}")
            except Exception as exc:  # noqa: BLE001
                failed.append((r["email"], str(exc)))
                print(f"  ✗ {r['email']}: {exc}")

            time.sleep(delay)
    finally:
        try:
            server.quit()
        except Exception:  # noqa: BLE001
            pass

    if failed:
        with open(failures_csv, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["email", "error"])
            writer.writerows(failed)
        print(f"\n📄 Failures written to {failures_csv}")

    return sent, failed


def from_hdr_addr(from_hdr):
    """Extract the bare address from 'Name <addr>' for the SMTP envelope."""
    if "<" in from_hdr and ">" in from_hdr:
        return from_hdr[from_hdr.index("<") + 1 : from_hdr.index(">")].strip()
    return from_hdr.strip()


def main():
    parser = argparse.ArgumentParser(description="InvertisPrep bulk email sender (SES SMTP)")
    parser.add_argument("--dry-run", action="store_true", help="List recipients, send nothing")
    parser.add_argument("--test", metavar="EMAIL", help="Send one test email to EMAIL")
    parser.add_argument("--limit", type=int, default=None, help="Only first N users")
    parser.add_argument("--rate", type=float, default=10.0, help="Max emails/sec (default 10)")
    parser.add_argument("--subject", default=DEFAULT_SUBJECT, help="Subject line override")
    parser.add_argument("--template", default=DEFAULT_TEMPLATE, help="HTML template path")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--failures-csv", default=os.path.join(HERE, "failed_sends.csv"))
    args = parser.parse_args()

    from_hdr = env("MAIL_FROM", default="InvertisPrep <no-reply@invertisprep.in>")
    reply_to = env("REPLY_TO", required=False, default="support@invertisprep.in")

    if not os.path.exists(args.template):
        print(f"✗ Template not found: {args.template}")
        sys.exit(1)
    with open(args.template, "r", encoding="utf-8") as fh:
        template_html = fh.read()

    subject = args.subject

    # ── test mode: one address, no DB needed ────────────────────────────────
    if args.test:
        print(f"🧪 Test mode → {args.test}")
        sent, failed = send_campaign(
            [{"email": args.test, "name": "Test User"}],
            args,
            template_html,
            f"[TEST] {subject}",
            from_hdr,
            reply_to,
        )
        print(f"\nDone. sent={sent} failed={len(failed)}")
        return

    # ── fetch recipients ────────────────────────────────────────────────────
    print("📥 Fetching recipients from MongoDB…")
    recipients = fetch_recipients(limit=args.limit)
    print(f"👥 {len(recipients)} recipients (active users, deduped)\n")
    if not recipients:
        print("Nothing to send.")
        return

    if args.dry_run:
        print("DRY RUN — no email will be sent. First 5 recipients:")
        for r in recipients[:5]:
            print(f"   • {r['name']} <{r['email']}>")
        print("\n── Preview of the first email ──\n")
        print(render(template_html, {"name": recipients[0]["name"], "email": recipients[0]["email"]}))
        print(f"\nFrom: {from_hdr}\nReply-To: {reply_to}\nSubject: {subject}")
        print(f"\nWould send to {len(recipients)} users over ~{len(recipients)/max(args.rate,1)/60:.1f} min.")
        return

    # ── confirm before the real send ────────────────────────────────────────
    if not args.yes:
        print(f"About to send to {len(recipients)} users from {from_hdr}")
        print(f"Subject: {subject}")
        if input('Type "send" to proceed: ').strip().lower() != "send":
            print("Aborted.")
            return

    sent, failed = send_campaign(
        recipients, args, template_html, subject, from_hdr, reply_to
    )
    print(f"\n✅ Finished. sent={sent} failed={len(failed)} of {len(recipients)}")


if __name__ == "__main__":
    main()
