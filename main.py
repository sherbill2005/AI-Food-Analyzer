import base64
import json
import os
from typing import Any, Dict

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

app = FastAPI(title="AI Food Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


def _extract_json(text: str) -> Dict[str, Any]:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    return json.loads(cleaned)


@app.post("/analyze")
async def analyze_food(image: UploadFile = File(...)) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    prompt = (
        "Identify the desi food in this image. Estimate the portion size in grams and provide "
        "calories, protein_g, carbs_g, and fat_g. Return only valid JSON using this schema: "
        '{"dish_name":"string","portion_size_grams":number,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number}'
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": image.content_type or "image/jpeg",
                            "data": base64.b64encode(image_bytes).decode("utf-8"),
                        }
                    },
                ]
            }
        ]
    }

    response = requests.post(
        GEMINI_URL,
        params={"key": GEMINI_API_KEY},
        json=payload,
        timeout=30,
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Gemini API request failed",
                "status_code": response.status_code,
                "body": response.text,
            },
        )

    try:
        text_output = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = _extract_json(text_output)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {exc}") from exc

    return {
        "dish_name": parsed.get("dish_name", "Unknown"),
        "portion_size_grams": parsed.get("portion_size_grams"),
        "calories": parsed.get("calories"),
        "protein_g": parsed.get("protein_g"),
        "carbs_g": parsed.get("carbs_g"),
        "fat_g": parsed.get("fat_g"),
    }
