"""Import timeline photos + captions from a Word doc.

Usage:
    pip install python-docx Pillow
    python3 scripts/import-docx.py path/to/our-story.docx

Expected doc layout (one block per moment, in chronological order):
    [image]
    Date: Summer 2019
    Title: First date
    Caption paragraph(s)...

"Date:" and "Title:" lines are optional; without a title, the first caption
sentence is used. Writes optimized WebP files to public/timeline/ (EXIF rotation
applied, metadata such as GPS stripped) and content/timeline.json for review.
"""

import io
import json
import re
import sys
from pathlib import Path

from docx import Document
from PIL import Image, ImageChops, ImageFile, ImageOps

# Some phone exports embed slightly truncated JPEGs; decode what's there
ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parent.parent
OUT_IMG = ROOT / "public" / "timeline"
OUT_JSON = ROOT / "content" / "timeline.json"
MAX_EDGE = 1600
NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40] or "moment"


def paragraph_images(doc, paragraph):
    """Yield image bytes for every picture embedded in a paragraph."""
    for blip in paragraph._p.iter(f"{NS}blip"):
        rid = blip.get(f"{REL}embed")
        if rid:
            yield doc.part.related_parts[rid].blob


def trim_borders(img: Image.Image, tolerance: int = 6) -> Image.Image:
    """Crop pure white/black letterbox bars (padding, phone-screenshot bars) but not pale skies."""
    rgb = img.convert("RGB")
    corner = rgb.getpixel((0, 0))
    if not (min(corner) >= 250 or max(corner) <= 5):
        return img
    bg = Image.new("RGB", rgb.size, corner)
    diff = ImageChops.difference(rgb, bg).convert("L").point(lambda v: 255 if v > tolerance else 0)
    box = diff.getbbox()
    if box and (box[2] - box[0]) * (box[3] - box[1]) < 0.97 * img.width * img.height:
        return img.crop(box)
    return img


def save_image(blob: bytes, slug: str) -> str:
    img = Image.open(io.BytesIO(blob))
    try:
        img.load()
    except OSError:
        print(f"warning: {slug} image data is damaged; saved what could be decoded")
    img = trim_borders(ImageOps.exif_transpose(img).convert("RGB"))
    img.thumbnail((MAX_EDGE, MAX_EDGE))
    path = OUT_IMG / f"{slug}.webp"
    # Re-encoding without exif= drops all original metadata
    img.save(path, "WEBP", quality=82)
    return f"/timeline/{path.name}"


def main(docx_path: str):
    doc = Document(docx_path)
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    moments, current = [], None
    for p in doc.paragraphs:
        for blob in paragraph_images(doc, p):
            current = {"blob": blob, "date": "", "title": "", "caption": []}
            moments.append(current)
        text = p.text.strip()
        if not text or current is None:
            continue
        if m := re.match(r"(?i)^date\s*:\s*(.+)", text):
            current["date"] = m.group(1)
        elif m := re.match(r"(?i)^title\s*:\s*(.+)", text):
            current["title"] = m.group(1)
        else:
            current["caption"].append(text)

    entries, used = [], set()
    for i, m in enumerate(moments, 1):
        caption = " ".join(m["caption"])
        # Also accept a trailing " - 2019" / " - Summer 2021" style date on the caption
        if not m["date"] and (d := re.search(r"\s+-\s+((?:[A-Za-z]+\s+)?\d{4})!?$", caption)):
            m["date"], caption = d.group(1), caption[: d.start()].strip()
        if not m["date"] and (y := re.search(r"\b(19|20)\d{2}\b", caption)):
            m["date"] = y.group(0)
        title =m["title"] or (re.split(r"(?<=[.!?])\s", caption)[0][:60] if caption else f"Moment {i}")
        slug = slugify(title)
        while slug in used:
            slug += f"-{i}"
        used.add(slug)
        entries.append(
            {
                "id": slug,
                "date": m["date"],
                "title": title,
                "caption": caption,
                "image": save_image(m["blob"], f"{i:02d}-{slug}"),
            }
        )

    OUT_JSON.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n")
    print(f"Imported {len(entries)} moments -> {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
