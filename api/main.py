import xml.etree.ElementTree as ET
import requests
import json

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from typing import List, Optional

app = FastAPI(
    title="Keyvo API",
    description="API for generating keyword suggestions.",
    version="0.2.0"
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

async def fetch_google_suggestions(query: str, country: Optional[str]) -> List[str]:
    """ Fetch keyword suggestions from Google search. """
    google_autocomplete_url = f"http://google.com/complete/search?output=toolbar&q={query}"

    if country:
        google_autocomplete_url += f"&gl={country}"

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
    except ET.ParseError:
        raise HTTPException(status_code=500, detail="Error parsing XML response")

async def fetch_youtube_suggestions(query: str) -> List[str]:
    """ Fetch keyword suggestions from YouTube search. """
    youtube_complete_url = f"http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q={query}"

    try:
        response = requests.get(youtube_complete_url)
        response.raise_for_status()

        response_text = response.text

        json_string = response_text
        if response_text.startswith('window.google.ac.h('):
            start = response_text.find('(')
            end = response_text.rfind(')')
            if start != -1 and end != -1:
                json_string = response_text[start + 1:end]
                
        json_data = json.loads(json_string)
        
        if len(json_data) > 1 and isinstance(json_data[1], list):
            return json_data[1]
        return []
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Error parsing YouTube's JSONP response: {e}")

@app.get("/")
def read_root():
    """ A simple endpoint to confirm the API is alive. """
    return {"message": "Welcome to the Keyvo API"}

@app.get("/api/keywords", response_model=List[str])
async def get_keyword_suggestions(q: Optional[str] = None, gl: Optional[str] = None,platform: str = "google"):
    """ Fetch keyword suggestions from various platforms. """
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    try:
        if platform == "youtube":
            return await fetch_youtube_suggestions(query=q)
        elif platform == "google":
            return await fetch_google_suggestions(query=q, country=gl)
        else:
            raise HTTPException(status_code=400, detail="Invalid platform specified. Use 'google' or 'youtube'.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Error fetching data from the external API: {e}") 
