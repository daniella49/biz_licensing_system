import fitz
import json
import os
from pathlib import Path
from dotenv import load_dotenv
import openai
import time

# Load environment variables from .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

INPUT_PDF = "data/18-07-2022_4.2A.pdf"
OUT_JSON = "data/processed_rules.json"

# Extract text from PDF pages
def extract_text_pages(pdf_path):
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        pages.append({"page": i + 1, "text": page.get_text("text")})
    return pages

# Summarize and categorize paragraph using OpenAI
def summarize_paragraph(para, retry=3):
    prompt = f"""
You are a regulatory assistant for Israeli businesses.
Rewrite the following legal paragraph in concise, clear, actionable Hebrew for a small business owner.
Also, determine category (like בשר, משלוחים, etc.) and conditions (serves_meat, deliveries)
Paragraph: {para}
Return JSON like: {{
    "summary": "...",
    "category": "...",
    "conditions": {{ "serves_meat": true/false, "deliveries": true/false }}
}}
"""
    for attempt in range(retry):
        try:
            resp = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )
            content = resp.choices[0].message.content.strip()
            return json.loads(content)
        except Exception as e:
            print(f"OpenAI error (attempt {attempt+1}/{retry}): {e}")
            time.sleep(1)
    # Fallback if LLM fails
    return {"summary": para, "category": "כללי", "conditions": {}}

# Build rules for all pages
def build_rules(pages):
    rules = []
    for page in pages:
        paragraphs = [p.strip() for p in page["text"].split("\n\n") if p.strip()]
        for i, para in enumerate(paragraphs):
            rule = summarize_paragraph(para)
            rules.append({
                "id": f"{page['page']}_{i}",
                "title": rule.get("category", "כללי"),
                "category": rule.get("category", "כללי"),
                "page": page["page"],
                "obligation": rule.get("summary", para),
                "conditions": rule.get("conditions", {}),
                "priority": 1
            })
    return rules

def main():
    print("Extracting text from PDF...")
    pages = extract_text_pages(INPUT_PDF)

    print("Processing paragraphs with OpenAI LLM...")
    rules = build_rules(pages)

    output = {"source_file": Path(INPUT_PDF).name, "rules_found": rules}
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Processed {len(rules)} rules into {OUT_JSON}")

if __name__ == "__main__":
    main()
