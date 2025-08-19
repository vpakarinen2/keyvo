# api/main.py

import xml.etree.ElementTree as ET
import requests

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from typing import List, Optional

app = FastAPI(
    title="Keyvo API",
    description="API for generating keyword suggestions.",
    version="0.1.0"
)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def read_root():
    """ A simple endpoint to confirm the API is alive. """
    return {"message": "Welcome to the Keyvo API"}

@app.get("/api/keywords", response_model=List[str])
async def get_keyword_suggestions(q: Optional[str] = None, gl: Optional[str] = None):
    """ Fetch keyword suggestions from external API. """
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    google_autocomplete_url = f"http://google.com/complete/search?output=toolbar&q={q}"

    if gl:
        google_autocomplete_url += f"&gl={gl}"

    try:
        response = requests.get(google_autocomplete_url)
        response.raise_for_status()

        response_text = response.content.decode('utf-8', 'ignore')

        root = ET.fromstring(response_text)
        suggestions = []

        for complete_suggestion in root.findall('CompleteSuggestion'):
            suggestion_element = complete_suggestion.find('suggestion')
            if suggestion_element is not None:
                suggestion_data = suggestion_element.get('data')
                if suggestion_data:
                    suggestions.append(suggestion_data)
        return suggestions
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Error fetching data from Google API: {e}")
    except ET.ParseError:
        raise HTTPException(status_code=500, detail=f"Error parsing XML response: {e}")
