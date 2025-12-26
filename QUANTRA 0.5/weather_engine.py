import requests

class WeatherEngine:
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        self.geo_url = "https://geocoding-api.open-meteo.com/v1/search"

    def get_coordinates(self, city_name):
        try:
            params = {"name": city_name, "count": 1, "language": "en", "format": "json"}
            response = requests.get(self.geo_url, params=params)
            data = response.json()
            if "results" in data:
                result = data["results"][0]
                return result["latitude"], result["longitude"], result["name"]
            return None, None, None
        except Exception as e:
            print(f"Error fetching coordinates: {e}")
            return None, None, None

    def get_weather(self, city_name):
        lat, lon, full_name = self.get_coordinates(city_name)
        if lat is None:
            return {"error": "CITY NOT FOUND"}

        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current_weather": True,
                "hourly": "temperature_2m,relative_humidity_2m,weather_code"
            }
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            current = data.get("current_weather", {})
            return {
                "city": full_name,
                "temp": current.get("temperature"),
                "wind": current.get("windspeed"),
                "condition_code": current.get("weathercode"),
                "unit": "°C"
            }
        except Exception as e:
            return {"error": f"FAILED TO FETCH WEATHER: {str(e)}"}

if __name__ == "__main__":
    engine = WeatherEngine()
    print(engine.get_weather("Mumbai"))
