import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

class AIBrain:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.api_ready = True
        else:
            self.api_ready = False
            print("WARNING: GEMINI_API_KEY not found in .env file")

    def get_outfit_suggestion(self, weather_data):
        if not self.api_ready:
            return "I NEED A GEMINI API KEY TO GIVE YOU A SMART SUGGESTION! (CHECK YOUR .ENV FILE)"
        
        prompt = f"""
        YOU ARE QUANTRA 0.5, A HELPFUL AI WEATHER ASSISTANT.
        BASED ON THIS WEATHER DATA: {weather_data}, SUGGEST EXACTLY WHAT THE USER SHOULD WEAR.
        KEEP THE ANSWER VERY SIMPLE, HUMAN-LIKE, AND USE SHORT SENTENCES.
        RESPONSE MUST BE IN ALL CAPITAL LETTERS.
        """
        
        for model_name in ["models/gemini-2.0-flash-exp", "models/gemini-2.5-flash", "models/gemini-flash-latest"]:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                return response.text.strip().upper()
            except:
                continue
                
        return "THE WEATHER IS PLEASANT. A LIGHT SWEATER OR A T-SHIRT SHOULD WORK FINE."

    def get_chat_response(self, user_query, history):
        if not self.api_ready:
            return "QUANTRA 0.5: PLEASE ADD YOUR GEMINI_API_KEY TO THE .ENV FILE TO CHAT!"

        formatted_history = []
        for entry in history:
            role = "user" if entry["role"] == "user" else "model"
            formatted_history.append({"role": role, "parts": [{"text": entry["content"]}]})

        personality = """
        YOU ARE QUANTRA 0.5, A SOPHISTICATED YET FRIENDLY AI ASSISTANT.
        PROJECT OWNER: PARTH PUNGAONKAR.
        RULES:
        1. ALWAYS TALK IN ALL CAPITAL LETTERS.
        2. ADDRESS PARTH AS 'PARTH SIR' WITH EXTREME RESPECT.
        3. KEEP RESPONSES VERY SHORT (UNDER 50 WORDS).
        4. NO MARKDOWN.
        """
        
        models_to_try = [
            "models/gemini-2.0-flash-exp", 
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-3-flash-preview"
        ]
        last_error = ""

        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                session_history = formatted_history[:-1] if len(formatted_history) > 1 else []
                chat = model.start_chat(history=session_history)
                
                prompt = f"{personality}\n\nUSER: {user_query}"
                response = chat.send_message(prompt)
                return response.text.strip().upper()
            except Exception as e:
                last_error = str(e)
                print(f"DEBUG: FAILED WITH {model_name} -> {last_error}")
                continue

        u_query = user_query.upper()
        if "PARTH" in u_query:
            return f"HELLO PARTH SIR! I AM HAVING TROUBLE CONNECTING. ERROR: {last_error.upper()}"
        
        return f"BRAIN FOG! ERROR: {last_error.upper()[:150]}"

if __name__ == "__main__":
    brain = AIBrain()
    print(brain.get_outfit_suggestion({"temp": 10, "condition": "Cloudy"}))
