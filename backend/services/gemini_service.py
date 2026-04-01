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


def _fix_common_typos(text: str) -> str:
    corrected = text or ""
    replacements = {
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

    if "birthday" in lowered:
        detail_sentence = "I wanted to invite you to my birthday celebration."
        ask_sentence = "It would mean a lot if you could join me. Please let me know if you can make it."
    elif "meeting" in lowered or "call" in lowered:
        detail_sentence = "I wanted to reach out to see if you would be open to a quick conversation."
        ask_sentence = "If this sounds good, please share a time that works for you."
    elif "follow up" in lowered or "following up" in lowered:
        detail_sentence = "I wanted to follow up on my earlier note."
        ask_sentence = "If you are interested, I would be happy to share more details."
    elif "thank" in lowered:
        detail_sentence = "I wanted to thank you for your time and support."
        ask_sentence = "I truly appreciate it."
    elif "sorry" in lowered or "apolog" in lowered:
        detail_sentence = "I wanted to apologize for the inconvenience."
        ask_sentence = "Thank you for your patience and understanding."
    else:
        detail_sentence = core_text[0].upper() + core_text[1:] if len(core_text) > 1 else core_text.upper()
        if not detail_sentence.endswith((".", "!", "?")):
            detail_sentence += "."
        ask_sentence = "Please let me know if this sounds good to you."

    if "polite" in lower_notes:
        ask_sentence = "I would be delighted if you were able to join. Please let me know if you can make it."
    elif "friendly" in lower_notes:
        ask_sentence = "I would love to have you there. Let me know if you can come."
    elif "professional" in lower_notes:
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
    refined_body = "\n".join(part for part in body_parts if part is not None).strip()

    for token in placeholders:
        if token not in refined_body and greeting_target != token:
            refined_body = refined_body.replace(detail_sentence, f"{detail_sentence} {token}")

    refined_subject = subject.strip() or _guess_subject_from_body(core_text)
    return {"subject": refined_subject, "body": refined_body}


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
    ]
    if any(marker in normalized for marker in generic_markers):
        return True
    source_tokens = {token for token in re.findall(r"[a-zA-Z]{3,}", (original_body or "").lower())}
    reply_tokens = {token for token in re.findall(r"[a-zA-Z]{3,}", normalized)}
    meaningful_overlap = len(source_tokens & reply_tokens)
    return meaningful_overlap == 0 and "and you" in (original_body or "").lower()


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
    prompt = f"""Write a professional, concise email reply.

Contact name: {contact_name}
Original subject: {original_subject}
Original email: {original_body}
{"Additional context: " + context if context else ""}

Write only the email body text, no subject line, no headers."""
    response = model.generate_content(prompt)
    return response.text.strip()


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


async def refine_email_copy(subject: str, body: str, notes: str = "") -> dict:
    try:
        model = _get_model()
        subject_placeholders = _extract_placeholders(subject)
        body_placeholders = _extract_placeholders(body)
        fallback_result = _fallback_refine_email_copy(subject, body, notes)
        prompt = f"""Write or refine this email based on the user's input.

Return a JSON object with:
- subject (string)
- body (string)

Rules:
- Treat the body as the user's source intent, notes, or rough draft.
- Write a complete ready-to-send email from that input.
- If the user already wrote a full email, refine it rather than changing the intent.
- If the user wrote only short notes or a brief prompt, expand it into a full email with a greeting, core message, and closing.
- Keep the message clear, natural, concise, and complete.
- Correct spelling, punctuation, and obvious grammar mistakes.
- Do not change the core intent.
- Do not add fake claims or extra facts.
- Preserve every placeholder exactly as written.
- Do not rewrite, rename, remove, or add braces around placeholders.
- Subject placeholders that must stay unchanged: {", ".join(subject_placeholders) if subject_placeholders else "None"}
- Body placeholders that must stay unchanged: {", ".join(body_placeholders) if body_placeholders else "None"}
- If the body is plain text, keep it plain text.
- If the subject is blank, generate a suitable subject.
- The body must read like a full email, not like notes or fragments.
- Keep placeholders in sensible positions inside the final email.
- Return only valid JSON.

Output quality:
- subject: polished and specific
- body: complete email ready to send
- body should usually include greeting, 2-4 short paragraphs, and a closing unless the user's style clearly suggests otherwise
- If subject is blank, infer an appropriate subject from the user's intent.
- If the draft is rough, rewrite it into fluent email prose instead of lightly editing fragments.
- Return only valid JSON.

Subject: {subject}
Body: {body}
Extra notes: {notes or "None"}
"""
        response = model.generate_content(prompt)
        result = _safe_json(response.text)
        candidate_subject = _clean_ai_candidate(result.get("subject", subject)).strip()
        candidate_body = _normalize_plaintext_email(_clean_ai_candidate(result.get("body", body)))
        final_subject = candidate_subject if _has_all_placeholders(candidate_subject, subject_placeholders) else subject
        final_body = candidate_body if _has_all_placeholders(candidate_body, body_placeholders) else body
        if not final_subject.strip():
            final_subject = fallback_result["subject"]
        should_use_fallback = (
            not final_body.strip()
            or final_body.strip() == body.strip()
            or len(final_body.strip()) <= max(30, len(body.strip()) + 5)
        )
        if should_use_fallback:
            final_body = fallback_result["body"]
        if not final_subject.strip() or final_subject.strip().lower() == body.strip().lower():
            final_subject = fallback_result["subject"]
        return {
            "subject": final_subject.strip(),
            "body": final_body.strip() or body,
        }
    except Exception:
        return _fallback_refine_email_copy(subject, body, notes)


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
        heuristic = _heuristic_reply(contact_name, original_subject, original_body, history_summary)
        model = _get_model()
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
- Focus on the recipient's newest message, not the quoted thread.
- Keep the reply under 160 words unless the context clearly requires more.
- If the recipient asks a casual reciprocal question like "and you?", answer it directly.
- If the context is lightweight or conversational, avoid stiff business language.
- Use placeholders like [your answer] only when the sender's personal answer is unknown.
- The suggested reply must feel specific to this thread, not like a reusable template.
- Mention concrete context from the thread when available.
- Return only valid JSON.

Contact name: {contact_name}
Company: {company}
Latest subject: {original_subject}
Latest email body: {original_body}
Recent thread summary: {history_summary or "None"}
Full thread transcript: {thread_transcript or "None"}
Operator notes: {notes or "None"}
"""
        response = model.generate_content(prompt)
        result = _safe_json(response.text)
        fallback_subject = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
        fallback_reply = await generate_reply(
            contact_name=contact_name,
            original_subject=original_subject,
            original_body=original_body,
            context="\n".join(part for part in [history_summary, thread_transcript, notes] if part),
        )
        candidate = {
            "thread_summary": result.get("thread_summary", ""),
            "key_points": result.get("key_points", [])[:4] if isinstance(result.get("key_points", []), list) else [],
            "suggested_subject": result.get("suggested_subject", fallback_subject),
            "suggested_reply": _normalize_plaintext_email(result.get("suggested_reply", fallback_reply)),
        }
        if not candidate["suggested_reply"] or _looks_generic(candidate["suggested_reply"], original_body):
            candidate["suggested_reply"] = fallback_reply
        if heuristic and _looks_generic(candidate["suggested_reply"], original_body):
            return heuristic
        if heuristic and not candidate["thread_summary"]:
            candidate["thread_summary"] = heuristic["thread_summary"]
        return candidate
    except Exception:
        heuristic = _heuristic_reply(contact_name, original_subject, original_body, history_summary)
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
