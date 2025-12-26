from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from decision_model import DecisionEngine
from ai_brain import AIBrain
from weather_engine import WeatherEngine
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


engine = DecisionEngine()
brain = AIBrain()
weather = WeatherEngine()

BASE_DIR = Path(__file__).resolve().parent.parent

app.mount("/static/home", StaticFiles(directory=str(BASE_DIR / "HOME")), name="home")
app.mount("/static/result", StaticFiles(directory=str(BASE_DIR / "RESULT")), name="result")
app.mount("/static/weekly", StaticFiles(directory=str(BASE_DIR / "WEEKLY")), name="weekly")
app.mount("/static/today", StaticFiles(directory=str(BASE_DIR / "TODAY")), name="today")
app.mount("/static/map", StaticFiles(directory=str(BASE_DIR / "MAP")), name="map")
app.mount("/static/about", StaticFiles(directory=str(BASE_DIR / "ABOUT")), name="about")
app.mount("/static/credits", StaticFiles(directory=str(BASE_DIR / "CREADITS")), name="credits")
app.mount("/static/quantra", StaticFiles(directory=str(BASE_DIR / "QUANTRA 0.5")), name="quantra")

@app.get("/")
async def home():
    return FileResponse(str(BASE_DIR / "HOME" / "index.html"))

@app.get("/result")
async def result():
    return FileResponse(str(BASE_DIR / "RESULT" / "index2.html"))

@app.get("/weekly")
async def weekly():
    return FileResponse(str(BASE_DIR / "WEEKLY" / "weekly.html"))

@app.get("/today")
async def today():
    return FileResponse(str(BASE_DIR / "TODAY" / "today.html"))

@app.get("/maps")
async def maps():
    return FileResponse(str(BASE_DIR / "MAP" / "maps.html"))

@app.get("/about")
async def about():
    return FileResponse(str(BASE_DIR / "ABOUT" / "about.html"))

@app.get("/credits")
async def credits():
    return FileResponse(str(BASE_DIR / "CREADITS" / "creadit.html"))

@app.get("/ai-mode")
async def ai_mode():
    return FileResponse(str(BASE_DIR / "QUANTRA 0.5" / "ai_mode.html"))


@app.post("/query")
async def process_query(request: Request):
    data = await request.json()
    query = data.get("query", "")
    city = data.get("city", None)
    
    if not city:
        query_upper = query.upper()
        for kw in ["IN ", "AT ", "FOR "]:
            if kw in query_upper:
                parts = query_upper.split(kw)
                extracted = parts[-1].split("?")[0].strip()
                if extracted:
                    city = extracted
                    break
        if not city and "WEATHER " in query_upper:
            city = query_upper.split("WEATHER ")[-1].strip()
    
    decision = engine.get_decision(query)
    history = engine.get_history()
    
    engine.save_to_history("user", query)
    
    response_text = ""
    
    if decision in ["weather_query", "lifestyle_suggestion"]:
        if city:
            weather_data = weather.get_weather(city)
            if "error" in weather_data:
                response_text = brain.get_chat_response(query, history).upper()
            else:
                if decision == "lifestyle_suggestion":
                    response_text = brain.get_outfit_suggestion(weather_data).upper()
                else:
                    import json
                    w_json = json.dumps({
                        "city": weather_data['city'],
                        "temp": weather_data['temp'],
                        "wind": weather_data['wind'],
                        "code": weather_data['condition_code'],
                        "unit": weather_data['unit']
                    })
                    response_text = f"WIDGET_WEATHER:{w_json}"
        else:
            response_text = brain.get_chat_response(query, history)
            
    else:
        response_text = brain.get_chat_response(query, history).upper()

    engine.save_to_history("ai", response_text)
    
    return {
        "decision": decision,
        "response": response_text,
        "query": query,
        "city": city,
        "history": engine.get_history()
    }

@app.post("/clear-database")
async def clear_db():
    return engine.clear_database()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
