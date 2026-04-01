import itertools
import json
import re
from typing import Optional
import google.generativeai as genai
from ..config import GEMINI_KEYS

# Round-robin iterator across API keys
_key_cycle = itertools.cycle(GEMINI_KEYS) if GEMINI_KEYS else None
MODEL_NAME = "gemini-2.5-flash"


def _get_model() -> genai.GenerativeModel:
    if not _key_cycle:
        raise RuntimeError("No Gemini API keys configured")
    key = next(_key_cycle)
    genai.configure(api_key=key)
    return genai.GenerativeModel(MODEL_NAME)


def _safe_json(text: str) -> dict:
    """Extract JSON from Gemini response (handles markdown fences)."""
    text = text.strip()
    # Remove markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}


def _compact_text(text: str, limit: int = 1200) -> str:
    compact = re.sub(r"\s+", " ", (text or "")).strip()
    if len(compact) <= limit:
        return compact
    return compact[: limit - 3].rstrip() + "..."


def _extract_placeholders(text: str) -> list[str]:
    seen = []
    for token in re.findall(r"\{\{[^{}]+\}\}|\{[^{}]+\}", text or ""):
        if token not in seen:
            seen.append(token)
    return seen


def _has_all_placeholders(text: str, placeholders: list[str]) -> bool:
    return all(token in (text or "") for token in placeholders)


def _normalize_plaintext_email(text: str) -> str:
    raw = (text or "").replace("\r\n", "\n").strip()
    if not raw:
        return ""
    paragraphs = [re.sub(r"\s+", " ", part).strip() for part in raw.split("\n\n")]
    return "\n\n".join(part for part in paragraphs if part)


def _plain_email_paragraphs(text: str) -> list[str]:
    return [part.strip() for part in _normalize_plaintext_email(text).split("\n\n") if part.strip()]


def _dedupe_paragraphs(text: str) -> str:
    seen: list[str] = []
    deduped: list[str] = []
    for paragraph in _plain_email_paragraphs(text):
        normalized = re.sub(r"\s+", " ", paragraph).strip().lower()
        if normalized in seen:
            continue
        seen.append(normalized)
        deduped.append(paragraph)
    return "\n\n".join(deduped)


def _fix_common_typos(text: str) -> str:
    corrected = text or ""
    replacements = {
        r"\bdisappearence\b": "disappearance",
        r"\bdisappearencee\b": "disappearance",
        r"\binvire\b": "invite",
        r"\binvitee\b": "invite",
        r"\bbithday\b": "birthday",
        r"\bbirthdayy\b": "birthday",
        r"\brecieve\b": "receive",
        r"\bteh\b": "the",
        r"\bthx\b": "thanks",
        r"\bpls\b": "please",
        r"\bim\b": "I'm",
        r"\bi\b": "I",
        r"\bu\b": "you",
    }
    for pattern, replacement in replacements.items():
        corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
    corrected = re.sub(r"\s+([,.!?])", r"\1", corrected)
    corrected = re.sub(r"([,.!?])([A-Za-z])", r"\1 \2", corrected)
    return corrected


def _guess_subject_from_body(body: str) -> str:
    text = " ".join(_fix_common_typos(body).split()).strip()
    if not text:
        return ""
    lowered = text.lower()

    if "birthday" in lowered:
        if "invite" in lowered or "invit" in lowered:
            return "Birthday Invitation"
        return "Invitation to My Birthday"
    if "follow up" in lowered or "following up" in lowered:
        return "Quick Follow-Up"
    if "meeting" in lowered:
        return "Meeting Invitation"
    if "call" in lowered:
        return "Quick Call"
    if "help" in lowered:
        return "Quick Help Request"
    if "thank" in lowered:
        return "Thank You"
    if "sorry" in lowered or "apolog" in lowered:
        return "Apology"

    shortened = re.sub(r"^[Hh]i\s+\{?[^,\n]+\,?\s*", "", text).strip()
    shortened = re.sub(r"^[Hh]ello\s+\{?[^,\n]+\,?\s*", "", shortened).strip()
    shortened = shortened.rstrip(".!? ")
    shortened = re.sub(r"\b(i|you|my)\b", "", shortened, flags=re.IGNORECASE)
    shortened = re.sub(r"\s+", " ", shortened).strip()
    if not shortened:
        shortened = "Quick note"
    words = shortened.split()[:6]
    return " ".join(word.capitalize() if word.islower() else word for word in words).strip() or "Quick note"


def _build_preview_context(
    subject: str,
    body: str,
    notes: str = "",
    contact_name: str = "",
    contact_email: str = "",
    dataset_name: str = "",
    recipient_count: int = 1,
) -> str:
    context_parts = [
        f"Dataset: {dataset_name or 'Unknown dataset'}",
        f"Preview recipient name: {contact_name or 'Unknown recipient'}",
        f"Preview recipient email: {contact_email or 'Unknown email'}",
        f"Recipient count: {recipient_count}",
        f"Existing subject: {subject or 'None'}",
        f"Source draft/body: {_compact_text(body, 1500) or 'None'}",
        f"Operator instructions: {notes or 'None'}",
    ]
    return "\n".join(context_parts)


def _sanitize_compose_body(body: str, source_body: str, contact_name: str = "") -> str:
    paragraphs = _plain_email_paragraphs(_dedupe_paragraphs(body))
    if not paragraphs:
        return ""

    greeting_pattern = r"^(hi|hello|dear)\b"
    source_normalized = re.sub(r"\s+", " ", _fix_common_typos(source_body)).strip().lower()
    cleaned: list[str] = []

    for index, paragraph in enumerate(paragraphs):
        normalized = re.sub(r"\s+", " ", paragraph).strip()
        lowered = normalized.lower()

        if index > 0 and re.match(greeting_pattern, lowered):
            continue
        if source_normalized and lowered == source_normalized:
            continue
        if source_normalized and len(source_normalized) < 160 and source_normalized in lowered and lowered.startswith(("hi ", "hello ", "dear ")):
            continue
        if (
            "if this looks relevant" in lowered
            or "if this sounds relevant" in lowered
            or "share the next details" in lowered
            or "let me know if this sounds good" in lowered
            or "happy to share more detail" in lowered
        ):
            continue
        cleaned.append(normalized)

    if not cleaned:
        return ""

    if not re.match(greeting_pattern, cleaned[0].lower()):
        cleaned.insert(0, f"Hi {contact_name or (_extract_placeholders(source_body)[0] if _extract_placeholders(source_body) else 'there')},")

    return _dedupe_paragraphs("\n\n".join(cleaned))


def _build_reply_context(
    contact_name: str,
    company: str,
    original_subject: str,
    original_body: str,
    history_summary: str = "",
    thread_transcript: str = "",
    notes: str = "",
) -> str:
    parts = [
        f"Contact name: {contact_name or 'there'}",
        f"Company: {company or 'Unknown'}",
        f"Latest subject: {original_subject or 'None'}",
        f"Latest inbound message: {_compact_text(original_body, 1200) or 'None'}",
        f"Thread summary: {_compact_text(history_summary, 1800) or 'None'}",
        f"Thread transcript: {_compact_text(thread_transcript, 3500) or 'None'}",
        f"Operator notes: {notes or 'None'}",
    ]
    return "\n".join(parts)


def _fallback_refine_email_copy(subject: str, body: str, notes: str = "") -> dict:
    clean_body = _normalize_plaintext_email(_fix_common_typos(body))
    if not clean_body:
        return {"subject": subject.strip(), "body": body}

    lines = [line.strip() for line in clean_body.split("\n") if line.strip()]
    placeholders = _extract_placeholders(clean_body)
    lower_notes = (notes or "").lower()
    greeting_target = placeholders[0] if placeholders else "there"
    greeting = f"Hi {greeting_target},"

    content_lines = [line for line in lines if line.lower() != greeting.lower()]
    core_text = " ".join(content_lines).strip() or clean_body
    core_text = re.sub(r"\s+", " ", core_text).strip()
    lowered = core_text.lower()

    if "thank" in lowered:
        if "event" in lowered:
            detail_sentence = "I wanted to thank you for attending the last event."
        else:
            detail_sentence = "I wanted to thank you for your time and support."
        ask_sentence = "I truly appreciate it."
    elif "sorry" in lowered or "apolog" in lowered:
        if "disappearance" in lowered and "event" in lowered:
            detail_sentence = "I wanted to apologize for being absent from recent events."
        else:
            detail_sentence = "I wanted to apologize for the inconvenience."
        ask_sentence = "Thank you for your patience and understanding."
    elif "super bowl" in lowered or "superbowl" in lowered:
        detail_sentence = "I am putting together a small Super Bowl watch and would love for you to join."
        ask_sentence = "If you are free, come a little before kickoff so we can settle in before the game. Let me know if you are in."
    elif "birthday" in lowered:
        detail_sentence = "I wanted to invite you to my birthday celebration."
        ask_sentence = "It would mean a lot if you could join me. Please let me know if you can make it."
    elif "invite" in lowered or "invitation" in lowered:
        detail_sentence = "I wanted to invite you to join me."
        ask_sentence = "If you are available, I would love to have you there. Let me know if you can make it."
    elif "meeting" in lowered or "call" in lowered:
        detail_sentence = "I wanted to reach out to see if you would be open to a quick conversation."
        ask_sentence = "If this sounds good, please share a time that works for you."
    elif "follow up" in lowered or "following up" in lowered:
        detail_sentence = "I wanted to follow up on my earlier note."
        ask_sentence = "If you are interested, I would be happy to share more details."
    else:
        detail_sentence = core_text[0].upper() + core_text[1:] if len(core_text) > 1 else core_text.upper()
        if not detail_sentence.endswith((".", "!", "?")):
            detail_sentence += "."
        ask_sentence = ""

    if "polite" in lower_notes and "apolog" not in lowered and "sorry" not in lowered and "thank" not in lowered:
        ask_sentence = "I would be delighted if you were able to join. Please let me know if you can make it."
    elif "friendly" in lower_notes and "apolog" not in lowered and "sorry" not in lowered and "thank" not in lowered:
        ask_sentence = "I would love to have you there. Let me know if you can come."
    elif "professional" in lower_notes and "apolog" not in lowered and "sorry" not in lowered and "thank" not in lowered:
        ask_sentence = "Please let me know if you would be available."

    closing = "Best regards,"
    if "warm" in lower_notes or "friendly" in lower_notes:
        closing = "Best,"

    body_parts = [
        greeting,
        "",
        detail_sentence,
        ask_sentence,
        "",
        closing,
    ]
    if "short" in lower_notes:
        body_parts = [greeting, "", detail_sentence, "", closing]
    refined_body = _sanitize_compose_body(_dedupe_paragraphs("\n".join(part for part in body_parts if part is not None).strip()), body)

    for token in placeholders:
        if token not in refined_body and greeting_target != token:
            refined_body = refined_body.replace(detail_sentence, f"{detail_sentence} {token}")

    refined_subject = subject.strip() or ("Super Bowl Watch Invite" if "super bowl" in lowered or "superbowl" in lowered else _guess_subject_from_body(core_text))
    return {"subject": refined_subject, "body": refined_body}


def _fallback_refine_email_copy_advanced(
    subject: str,
    body: str,
    notes: str = "",
    contact_name: str = "",
    recipient_count: int = 1,
) -> dict:
    return _fallback_refine_email_copy(subject, body, notes)


def _fallback_reply(contact_name: str, original_body: str) -> str:
    clean = _normalize_plaintext_email(_fix_common_typos(original_body))
    lower = clean.lower()
    subject_line = ""
    if "haha" in lower or "lol" in lower:
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Haha, got it. Thanks for the quick reply.\n\n"
            "If you want, I can send the next details here.\n\n"
            "Best,\nYour team"
        )
    if "accept" in lower or re.search(r"\b(yes|sure|sounds good|i can join)\b", lower):
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Thanks for confirming. Glad to hear that.\n\n"
            "I will share the next details with you shortly.\n\n"
            "Best,\nYour team"
        )
    if "when" in lower:
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Thanks for asking. I can share the exact timing and details with you here.\n\n"
            "If helpful, I can send the full schedule in my next message.\n\n"
            "Best,\nYour team"
        )
    if "what" in lower:
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Happy to clarify. Here is the quick context behind my earlier message.\n\n"
            "If you want, I can also explain it in a little more detail.\n\n"
            "Best,\nYour team"
        )
    if "help" in lower:
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Thanks for your reply. I would be happy to help. "
            "I can share a short overview of how the workflow works and answer any specific questions you have.\n\n"
            "If helpful, I can send a quick summary or walk through it step by step.\n\n"
            "Best,\nYour team"
        )
    if "price" in lower or "cost" in lower:
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Thanks for your reply. I can share pricing details and the setup options that fit your use case.\n\n"
            "If you want, send over your main requirement and I will tailor the details for you.\n\n"
            "Best,\nYour team"
        )
    if "not interested" in lower:
        return (
            f"Hi {contact_name or 'there'},\n\n"
            "Thanks for letting me know. I appreciate the quick reply.\n\n"
            "If the timing changes later, I would be happy to reconnect.\n\n"
            "Best,\nYour team"
        )
    return (
        f"Hi {contact_name or 'there'},\n\n"
        "Thanks for your reply. I appreciate it.\n\n"
        "Happy to share more detail or answer any specific questions if that would be useful.\n\n"
        "Best,\nYour team"
    )


def _event_timing_reply(contact_name: str, original_subject: str, original_body: str, history_summary: str = "") -> dict | None:
    subject = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
    combined_context = f"{original_subject} {history_summary}".lower()
    lower_body = (original_body or "").lower()

    asks_for_time = any(
        phrase in lower_body
        for phrase in [
            "what are the timings",
            "what is the timing",
            "what time",
            "when does it start",
            "when is the event",
            "timings for the event",
        ]
    )
    is_super_bowl_thread = any(token in combined_context for token in ["super bowl", "superbowl"])
    is_invitation_thread = any(token in combined_context for token in ["invitation", "invite", "watch"])

    if asks_for_time and is_super_bowl_thread and is_invitation_thread:
        return {
            "thread_summary": "The recipient asked for the event timing for the Super Bowl watch invitation.",
            "key_points": [
                "They want the timing details.",
                "This is a Super Bowl watch invitation thread.",
                "Answer directly with the event timing instead of giving a generic clarification.",
            ],
            "suggested_subject": subject,
            "suggested_reply": (
                f"Hi {contact_name or 'there'},\n\n"
                "Kickoff is around 6:30 PM ET, and I am planning to start a bit before that so we can settle in before the game.\n\n"
                "I will send you the final start time and the full details here shortly.\n\n"
                "Best,\nYour team"
            ),
        }

    if asks_for_time and is_invitation_thread:
        return {
            "thread_summary": "The recipient asked what time the invited event starts.",
            "key_points": [
                "They are asking for the event timing.",
                "The reply should answer directly and mention that final details will follow if needed.",
            ],
            "suggested_subject": subject,
            "suggested_reply": (
                f"Hi {contact_name or 'there'},\n\n"
                "It starts at [event start time]. I will also send over the full details here so everything is easy to follow.\n\n"
                "Best,\nYour team"
            ),
        }

    return None


def _fallback_thread_summary(original_body: str, history_summary: str = "") -> str:
    clean = " ".join((original_body or "").split()).strip()
    if not clean:
        return "The recipient sent a brief reply."
    if clean.lower().endswith("and you?"):
        answer = clean[:-8].strip(" ,")
        if answer:
            return f"The recipient answered the question with '{answer}' and asked the same question back."
    if clean.endswith("?"):
        return f"The recipient replied with a short question: {clean}"
    if len(clean) < 80:
        return f"The recipient gave a brief reply: {clean}"
    return clean[:180]


def _heuristic_reply(contact_name: str, original_subject: str, original_body: str, history_summary: str = "") -> dict | None:
    subject = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
    clean = " ".join((original_body or "").split()).strip()
    lower_body = clean.lower()
    lower_subject = (original_subject or "").lower()
    lower_history = (history_summary or "").lower()

    if "who do you support in ipl" in lower_subject or "who do you support in ipl" in lower_history:
        team = clean.replace(", and you?", "").replace("and you?", "").strip(" .")
        summary = f"The recipient said they support {team or 'a team'} and asked who you support." if "and you" in lower_body else f"The recipient said they support {team or 'a team'}."
        reply = (
            f"Hi {contact_name or 'there'},\n\n"
            f"{'Nice choice.' if team else 'Nice.'} "
            "I am cheering for [your team] this season. "
            "It should be a fun IPL to watch.\n\n"
            "Best,\nYour team"
        )
        return {
            "thread_summary": summary,
            "key_points": [
                f"They support {team or 'their team'}.",
                "They asked your preference back." if "and you" in lower_body else "They shared their answer.",
            ],
            "suggested_subject": subject,
            "suggested_reply": reply,
        }

    if clean.endswith("and you?"):
        reply = (
            f"Hi {contact_name or 'there'},\n\n"
            "Thanks for sharing. I would say [your answer] on my side.\n\n"
            "Best,\nYour team"
        )
        return {
            "thread_summary": "The recipient answered and asked the same question back.",
            "key_points": ["They gave their answer.", "They want your answer too."],
            "suggested_subject": subject,
            "suggested_reply": reply,
        }

    return None


def _looks_generic(reply_text: str, original_body: str) -> bool:
    normalized = " ".join((reply_text or "").lower().split())
    if not normalized:
        return True
    generic_markers = [
        "thanks for your reply. i appreciate it.",
        "happy to share more detail or answer any specific questions",
        "i appreciate the note and will follow up shortly",
        "happy to clarify. here is the quick context behind my earlier message.",
        "if you want, i can also explain it in a little more detail.",
    ]
    if any(marker in normalized for marker in generic_markers):
        return True
    source_tokens = {token for token in re.findall(r"[a-zA-Z]{3,}", (original_body or "").lower())}
    reply_tokens = {token for token in re.findall(r"[a-zA-Z]{3,}", normalized)}
    meaningful_overlap = len(source_tokens & reply_tokens)
    return meaningful_overlap == 0 and "and you" in (original_body or "").lower()


def _is_high_quality_preview(body: str, source_body: str) -> bool:
    normalized = _dedupe_paragraphs(_normalize_plaintext_email(body))
    source_normalized = _normalize_plaintext_email(source_body)
    if not normalized:
        return False
    generic_markers = [
        "i wanted to reach out",
        "i hope you are doing well",
        "if this looks relevant",
        "if this sounds relevant",
        "share the next details",
    ]
    lowered = normalized.lower()
    if any(marker in lowered for marker in generic_markers):
        return False
    if normalized == source_normalized and len(normalized) < 140:
        return False
    paragraphs = _plain_email_paragraphs(normalized)
    if len(paragraphs) < 2:
        return False
    if len(paragraphs) != len({re.sub(r"\s+", " ", paragraph).strip().lower() for paragraph in paragraphs}):
        return False
    if any(
        paragraphs[i].strip().lower() == paragraphs[i - 1].strip().lower()
        for i in range(1, len(paragraphs))
    ):
        return False
    if len(normalized) < max(90, min(len(source_normalized) + 20, 140)):
        return False
    if sum(1 for paragraph in paragraphs if re.match(r"^(hi|hello|dear)\b", paragraph.lower())) > 1:
        return False
    return True


def _is_high_quality_reply(reply_text: str, original_body: str, thread_transcript: str = "") -> bool:
    normalized = _normalize_plaintext_email(reply_text)
    if not normalized or _looks_generic(normalized, original_body):
        return False
    if len(normalized) < 45:
        return False
    lower_original = (original_body or "").lower()
    lower_reply = normalized.lower()
    if any(phrase in lower_original for phrase in ["what time", "timings", "when does it start", "when is the event"]):
        if not any(token in lower_reply for token in ["am", "pm", "time", "start", "kickoff"]):
            return False
    source_tokens = {
        token
        for token in re.findall(r"[a-zA-Z]{4,}", f"{original_body} {thread_transcript}".lower())
        if token not in {"from", "subject", "message", "recipient"}
    }
    reply_tokens = {token for token in re.findall(r"[a-zA-Z]{4,}", normalized.lower())}
    if source_tokens and len(source_tokens & reply_tokens) == 0 and "and you" not in original_body.lower():
        return False
    return True


def _clean_ai_candidate(text: str) -> str:
    candidate = (text or "").strip()
    candidate = re.sub(r"^```(?:json)?\s*", "", candidate)
    candidate = re.sub(r"\s*```$", "", candidate)
    return candidate.strip()


async def analyze_email(subject: str, body: str) -> dict:
    """Analyze an email and return ai_analysis fields."""
    try:
        model = _get_model()
        prompt = f"""Analyze this email and return a JSON object with these fields:
- summary (string, 1-2 sentences)
- intent (string: Opportunity | Question | Complaint | Spam | Follow-up | Demo Request | Other)
- tone (string: Positive | Neutral | Negative | Urgent)
- priority (integer 1-10, 10 = most urgent)

Email subject: {subject}
Email body: {body}

Return only valid JSON, no markdown."""
        response = model.generate_content(prompt)
        result = _safe_json(response.text)
        return {
            "summary": result.get("summary", ""),
            "intent": result.get("intent", "Other"),
            "tone": result.get("tone", "Neutral"),
            "priority": int(result.get("priority", 5)),
        }
    except Exception:
        return {
            "summary": body[:180],
            "intent": "Other",
            "tone": "Neutral",
            "priority": 5,
        }


async def generate_reply(contact_name: str, original_subject: str, original_body: str, context: str = "") -> str:
    """Generate a professional reply to an email."""
    model = _get_model()
    context_block = f"Additional context:\n{context}" if context else ""
    prompt = f"""Write a specific, context-aware email reply.

Rules:
- Output only the email body.
- Reply to the recipient's actual message, not a generic acknowledgment.
- Use thread context when provided.
- Answer direct questions before suggesting next steps.
- Keep the tone natural and human.
- Do not invent facts, dates, pricing, or commitments.
- Avoid filler like "Thanks for your reply. I appreciate it." unless it is genuinely appropriate.

Contact name: {contact_name}
Original subject: {original_subject}
Original email: {original_body}
{context_block}
"""
    response = model.generate_content(prompt)
    return _normalize_plaintext_email(response.text)


async def generate_email_draft(
    contact_name: str,
    company: str,
    subject: str,
    context: str = "",
    instructions: str = "",
    tags: Optional[list[str]] = None,
    profile_summary: str = "",
    history_summary: str = "",
) -> str:
    """Generate a net-new outreach email or a contextual follow-up draft."""
    model = _get_model()
    prompt = f"""Write a concise, high-quality email draft.

Rules:
- Output only the email body, no subject line or headers.
- Keep it under 180 words.
- Sound specific, modern, and human, not generic sales spam.
- If context/history suggests this is a reply or follow-up, honor that.
- End with a clear but low-friction call to action.

Contact name: {contact_name}
Company: {company}
Subject: {subject}
Known tags: {", ".join(tags or [])}
AI profile summary: {profile_summary or "None"}
Recent interaction summary: {history_summary or "None"}
User context: {context or "None"}
Extra instructions: {instructions or "None"}
"""
    response = model.generate_content(prompt)
    return response.text.strip()


async def refine_email_copy(
    subject: str,
    body: str,
    notes: str = "",
    contact_name: str = "",
    contact_email: str = "",
    dataset_name: str = "",
    recipient_count: int = 1,
) -> dict:
    try:
        model = _get_model()
        subject_placeholders = _extract_placeholders(subject)
        body_placeholders = _extract_placeholders(body)
        fallback_result = _fallback_refine_email_copy_advanced(subject, body, notes, contact_name, recipient_count)
        preview_context = _build_preview_context(
            subject=subject,
            body=body,
            notes=notes,
            contact_name=contact_name,
            contact_email=contact_email,
            dataset_name=dataset_name,
            recipient_count=recipient_count,
        )
        prompt = f"""Refine this email draft into clear, natural, polished email text.

Return a JSON object with:
- subject (string)
- body (string)

Rules:
- Keep the original meaning.
- Fix grammar, spelling, tone, and flow.
- Write one clean final email only.
- Do not repeat the user's rough draft inside the final output.
- Do not repeat greetings or paragraphs.
- Preserve every placeholder exactly as written.
- Keep plain text as plain text.
- If the subject is blank, write a suitable subject.
- Do not add generic filler like "If this looks relevant..." or sales-style CTAs unless the draft clearly asks for that.
- For thank-you or apology emails, keep the close simple and sincere.
- Correct spelling, punctuation, and obvious grammar mistakes.
- Do not add fake claims or extra facts.
- Subject placeholders that must stay unchanged: {", ".join(subject_placeholders) if subject_placeholders else "None"}
- Body placeholders that must stay unchanged: {", ".join(body_placeholders) if body_placeholders else "None"}
- Return only valid JSON.

Context:
{preview_context}
"""
        response = model.generate_content(prompt)
        result = _safe_json(response.text)
        candidate_subject = _clean_ai_candidate(result.get("subject", subject)).strip()
        candidate_body = _sanitize_compose_body(_dedupe_paragraphs(_normalize_plaintext_email(_clean_ai_candidate(result.get("body", body)))), body, contact_name)
        final_subject = candidate_subject if _has_all_placeholders(candidate_subject, subject_placeholders) else subject
        final_body = candidate_body if _has_all_placeholders(candidate_body, body_placeholders) else body
        if not final_subject.strip():
            final_subject = fallback_result["subject"]
        if not _is_high_quality_preview(final_body, body):
            final_body = _sanitize_compose_body(fallback_result["body"], body, contact_name)
        if not final_subject.strip() or final_subject.strip().lower() == body.strip().lower():
            final_subject = fallback_result["subject"]
        return {
            "subject": final_subject.strip(),
            "body": final_body.strip() or body,
        }
    except Exception:
        return _fallback_refine_email_copy_advanced(subject, body, notes, contact_name, recipient_count)


async def summarize_reply_with_context(
    original_subject: str,
    original_body: str,
    history_summary: str = "",
) -> str:
    try:
        model = _get_model()
        prompt = f"""Write a short, human-friendly summary of the recipient's latest reply.

Rules:
- 1 sentence only.
- Summarize meaning, do not copy the reply verbatim unless necessary.
- Use thread context when needed.
- If the recipient answered a question and asked one back, mention both.
- Return plain text only.

Latest subject: {original_subject}
Latest reply: {original_body}
Thread context: {history_summary or "None"}
"""
        response = model.generate_content(prompt)
        text = " ".join(response.text.split()).strip()
        return text or _fallback_thread_summary(original_body, history_summary)
    except Exception:
        return _fallback_thread_summary(original_body, history_summary)


async def suggest_reply_with_context(
    contact_name: str,
    company: str,
    original_subject: str,
    original_body: str,
    history_summary: str = "",
    thread_transcript: str = "",
    notes: str = "",
) -> dict:
    """Summarize recent thread context and suggest a reply in structured JSON."""
    try:
        heuristic = _event_timing_reply(contact_name, original_subject, original_body, history_summary) or _heuristic_reply(contact_name, original_subject, original_body, history_summary)
        model = _get_model()
        reply_context = _build_reply_context(
            contact_name=contact_name,
            company=company,
            original_subject=original_subject,
            original_body=original_body,
            history_summary=history_summary,
            thread_transcript=thread_transcript,
            notes=notes,
        )
        prompt = f"""You are an expert executive communications assistant.

Review the latest inbound email plus recent thread context and return a JSON object with:
- thread_summary (string, max 2 sentences)
- key_points (array of 2-4 short bullet-like strings)
- suggested_subject (string)
- suggested_reply (string, the full email body only, no headers)

Rules:
- Make the reply concise, professional, and natural.
- Reference the actual context when relevant.
- If the message asks a question, answer it directly before proposing next steps.
- Focus on the recipient's newest message while using the full thread to resolve context.
- Keep the reply under 160 words unless the context clearly requires more.
- If the recipient asks a casual reciprocal question like "and you?", answer it directly.
- If the context is lightweight or conversational, avoid stiff business language.
- Use placeholders like [your answer] only when the sender's personal answer is unknown.
- The suggested reply must feel specific to this thread, not like a reusable template.
- Mention concrete context from the thread when available.
- Do not fall back to generic acknowledgments when the thread contains details you can use.
- If the latest message is a follow-up to earlier discussion, carry that forward explicitly.
- Do not invent commitments, pricing, dates, or capabilities that are not in the thread or notes.
- Return only valid JSON.

Context:
{reply_context}
"""
        response = model.generate_content(prompt)
        result = _safe_json(response.text)
        fallback_subject = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
        fallback_reply = await generate_reply(
            contact_name=contact_name,
            original_subject=original_subject,
            original_body=original_body,
            context=reply_context,
        )
        candidate = {
            "thread_summary": result.get("thread_summary", ""),
            "key_points": result.get("key_points", [])[:4] if isinstance(result.get("key_points", []), list) else [],
            "suggested_subject": result.get("suggested_subject", fallback_subject),
            "suggested_reply": _normalize_plaintext_email(result.get("suggested_reply", fallback_reply)),
        }
        if not _is_high_quality_reply(candidate["suggested_reply"], original_body, thread_transcript):
            candidate["suggested_reply"] = fallback_reply
        if heuristic and not _is_high_quality_reply(candidate["suggested_reply"], original_body, thread_transcript):
            return heuristic
        if heuristic and not candidate["thread_summary"]:
            candidate["thread_summary"] = heuristic["thread_summary"]
        if not candidate["thread_summary"]:
            candidate["thread_summary"] = _fallback_thread_summary(original_body, history_summary)
        return candidate
    except Exception:
        heuristic = _event_timing_reply(contact_name, original_subject, original_body, history_summary) or _heuristic_reply(contact_name, original_subject, original_body, history_summary)
        if heuristic:
            return heuristic
        fallback_subject = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
        return {
            "thread_summary": _fallback_thread_summary(original_body, history_summary),
            "key_points": [],
            "suggested_subject": fallback_subject,
            "suggested_reply": _fallback_reply(contact_name, original_body),
        }


async def profile_contact(name: str, emails_summary: str) -> dict:
    """Generate AI profile fields for a contact based on their email history."""
    model = _get_model()
    prompt = f"""Based on this contact's email history, return a JSON object with:
- summary (string: 1-2 sentence profile of this person)
- engagement_score (float 0-100: how engaged are they?)
- response_probability (float 0-1: likelihood they'll respond to outreach)
- interest_tags (array of strings: topics they care about, max 5)

Contact name: {name}
Email history summary: {emails_summary}

Return only valid JSON, no markdown."""
    response = model.generate_content(prompt)
    result = _safe_json(response.text)
    return {
        "summary": result.get("summary", ""),
        "engagement_score": float(result.get("engagement_score", 50)),
        "response_probability": float(result.get("response_probability", 0.5)),
        "interest_tags": result.get("interest_tags", []),
    }


async def generate_campaign_email(template: str, contact_name: str, company: str, tags: list) -> str:
    """Personalize a campaign email template for a specific contact."""
    model = _get_model()
    prompt = f"""Personalize this email template for the contact below.
Replace placeholders like {{name}}, {{company}} and make it feel personal and relevant.

Template: {template}

Contact name: {contact_name}
Company: {company}
Interest tags: {', '.join(tags)}

Return only the personalized email body."""
    response = model.generate_content(prompt)
    return response.text.strip()
