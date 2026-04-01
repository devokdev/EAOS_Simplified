DEFAULT_TEMPLATES = [
    {
        "key": "clean_card",
        "name": "Clean card",
        "description": "Simple white card with a soft border.",
        "subject": "",
        "body": """
<div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:32px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;padding:32px;color:#111827;line-height:1.7;">
    {content}
  </div>
</div>
""".strip(),
    },
    {
        "key": "accent_header",
        "name": "Accent header",
        "description": "Simple header band with clean content area.",
        "subject": "",
        "body": """
<div style="font-family:Arial,sans-serif;background:#eef4ff;padding:32px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #c7d2fe;">
    <div style="background:#2563eb;color:#ffffff;padding:18px 28px;font-weight:700;">Message</div>
    <div style="padding:28px;color:#0f172a;line-height:1.7;">
      {content}
    </div>
  </div>
</div>
""".strip(),
    },
    {
        "key": "soft_split",
        "name": "Soft split",
        "description": "Muted background with spacious reading area.",
        "subject": "",
        "body": """
<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;">
  <div style="max-width:680px;margin:0 auto;display:grid;grid-template-columns:120px 1fr;background:#ffffff;border:1px solid #dbeafe;border-radius:20px;overflow:hidden;">
    <div style="background:#dbeafe;"></div>
    <div style="padding:32px;color:#1e293b;line-height:1.75;">
      {content}
    </div>
  </div>
</div>
""".strip(),
    },
    {
        "key": "minimal_frame",
        "name": "Minimal frame",
        "description": "Thin frame, neutral layout, no decoration.",
        "subject": "",
        "body": """
<div style="font-family:Arial,sans-serif;background:#ffffff;padding:24px;">
  <div style="max-width:680px;margin:0 auto;border:1px solid #e2e8f0;padding:28px;color:#0f172a;line-height:1.7;">
    {content}
  </div>
</div>
""".strip(),
    },
]


def list_templates():
    return DEFAULT_TEMPLATES


def get_template(template_key: str):
    if not template_key:
        return None
    for template in DEFAULT_TEMPLATES:
        if template["key"] == template_key:
            return template
    return None


def render_placeholders(value: str, *, name: str, email: str, content: str = "") -> str:
    return (
        value.replace("{name}", name or "there")
        .replace("{email}", email or "")
        .replace("{content}", content or "")
    )


def wrap_with_template(template_html: str, message_html: str, *, name: str, email: str) -> str:
    return render_placeholders(template_html, name=name, email=email, content=message_html)
