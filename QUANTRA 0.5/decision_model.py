import json
import os

class DecisionEngine:
    def __init__(self, database_path="DATABASE.txt"):
        self.database_path = database_path
        self.history = [] 

    def clear_database(self):
        self.history = []
        return {"status": "success", "message": "Memory history cleared"}

    def get_decision(self, query):
        query = query.lower()
        
        weather_keywords = [
            "weather", "temperature", "temp", "rain", "rainy", "sunny", "cloudy", 
            "wind", "humidity", "forecast", "sky", "wethaer", "wheather", "weater",
            "hot", "cold", "degree", "celcius", "fahrenheit"
        ]

        suggestion_keywords = [
            "wear", "outfit", "jacket", "shirt", "dress", "clothing", "suggest", 
            "recommend", "should i", "can i go", "clothes", "style", "today's look"
        ]
        
        is_weather = any(word in query for word in weather_keywords)
        is_suggestion = any(word in query for word in suggestion_keywords)

        if is_suggestion:
            return "lifestyle_suggestion"
        elif is_weather:
            return "weather_query"
        else:
            return "chat"

    def save_to_history(self, role, content):
        self.history.append({"role": role, "content": content})

    def get_history(self):
        return self.history

if __name__ == "__main__":
    engine = DecisionEngine()
    print(f"Query: 'What should I wear today?' -> Decision: {engine.get_decision('What should I wear today?')}")
    print(f"Query: 'How is the weather?' -> Decision: {engine.get_decision('How is the weather?')}")
    print(f"Query: 'Hello how are you?' -> Decision: {engine.get_decision('Hello how are you?')}")
