import io
import csv
import json
from typing import List
from utils.clients import getChatModelName
from utils.clients import getAsyncOpenai

def _autodetect_and_convert(value: str):
    if not isinstance(value, str):
        return value
    val_lower = value.strip().lower()
    if val_lower == "true":
        return True
    if val_lower == "false":
        return False
    try:
        return int(value.strip())
    except (ValueError, TypeError):
        pass
    try:
        return float(value.strip())
    except (ValueError, TypeError):
        pass
    return value


def extractDataFromFile(filename: str, content_type: str, raw_bytes: bytes) -> List[dict]:
    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    if ctype in ("text/csv", "application/csv", "application/vnd.ms-excel") or name.endswith(".csv"):
        stream = io.StringIO(raw_bytes.decode("utf-8"))
        reader = csv.DictReader(stream)
        data_list: List[dict] = []
        for row in reader:
            processed_row = {
                key: _autodetect_and_convert(value) for key, value in (row or {}).items() if value is not None and value.strip() != ""
            }
            if processed_row:
                data_list.append(processed_row)
        return data_list

    try:
        data = json.loads(raw_bytes.decode("utf-8"))
    except Exception as e:
        raise ValueError("Unsupported or invalid file. Provide CSV or JSON.") from e

    data_list: List[dict] = []
    
    items_to_process = []
    if isinstance(data, list):
        items_to_process = data
    elif isinstance(data, dict) and isinstance(data.get("items"), list):
        items_to_process = data["items"]
    elif isinstance(data, dict):
        return [data]

    for item in items_to_process:
        if isinstance(item, dict):
            data_list.append(item)
        else:
            data_list.append({"text": str(item)})
    
    if not data_list and not items_to_process and isinstance(data, dict):
         raise ValueError("Unsupported JSON structure. Expected a list of objects, a dictionary with an 'items' list, or a single object dictionary.")

    return data_list

	
async def getStructuredVectorQuery(query: str) -> list[dict]:

    client = getAsyncOpenai()
    model = getChatModelName()
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_property_filters",
                "description": "Get filters for property search from a user query.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "bedrooms_min": {"type": "integer", "description": "Minimum number of bedrooms"},
                        "bedrooms_max": {"type": "integer", "description": "Maximum number of bedrooms"},
                        "bathrooms_min": {"type": "integer", "description": "Minimum number of bathrooms"},
                        "bathrooms_max": {"type": "integer", "description": "Maximum number of bathrooms"},
                        "price_min": {"type": "number", "description": "Minimum price"},
                        "price_max": {"type": "number", "description": "Maximum price"},
                        "property_type": {
                            "type": "string",
                            "description": "The type of property.",
                        },
                        "is_new_home": {"type": "boolean", "description": "Whether the property is a new home"},
                        "crime_score_weight_min": {"type": "number", "description": "Minimum crime score weight"},
                        "crime_score_weight_max": {"type": "number", "description": "Maximum crime score weight"},
                        "flood_risk": {
                            "type": "string",
                            "description": "Flood risk assessment, e.g. 'Low', 'Medium', 'High'",
                        },
                        "laua": {
                            "type": "string",
                            "description": "The Local Authority Upper Tier code for the area (e.g., E07000209)",
                        },
                    },
                    "required": [],
                },
            },
        }
    ]
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": query}],
            tools=tools,
            tool_choice="auto",
        )
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        filters = []
        if tool_calls:
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                if function_name == "get_property_filters":
                    args = json.loads(tool_call.function.arguments)
                    if "bedrooms_min" in args:
                        filters.append({"bedrooms": {"$gte": args["bedrooms_min"]}})
                    if "bedrooms_max" in args:
                        filters.append({"bedrooms": {"$lte": args["bedrooms_max"]}})
                    if "bathrooms_min" in args:
                        filters.append({"bathrooms": {"$gte": args["bathrooms_min"]}})
                    if "bathrooms_max" in args:
                        filters.append({"bathrooms": {"$lte": args["bathrooms_max"]}})
                    if "price_min" in args:
                        filters.append({"price": {"$gte": args["price_min"]}})
                    if "price_max" in args:
                        filters.append({"price": {"$lte": args["price_max"]}})
                    if "property_type" in args:
                        filters.append({"property_type_full_description": {"$eq": args["property_type"]}})
                    if "is_new_home" in args:
                        filters.append({"is_new_home": {"$eq": args["is_new_home"]}})
                    if "crime_score_weight_min" in args:
                        filters.append({"crime_score_weight": {"$gte": args["crime_score_weight_min"]}})
                    if "crime_score_weight_max" in args:
                        filters.append({"crime_score_weight": {"$lte": args["crime_score_weight_max"]}})
                    if "flood_risk" in args:
                        filters.append({"flood_risk": {"$eq": args["flood_risk"]}})
                    if "laua" in args:
                        filters.append({"laua": {"$eq": args["laua"]}})
        return filters
    except Exception as e:
        print(f"Error extracting filters from query: {e}")
        return []


async def generateSemanticQuery(query: str) -> str:
    """
    Generates a clean, semantic query from a raw user query by stripping out
    filterable criteria.
    """

    client = getAsyncOpenai()
    model = getChatModelName()

    prompt = f"""
    You are an expert at refining search queries. Your task is to take a user's raw query about real estate and convert it into a concise, purely semantic search phrase.

    Instructions:
    1.  Identify the core intent or concept the user is looking for (e.g., "family home," "modern apartment," "property near a park").
    2.  Remove any specific, quantifiable criteria that can be used as database filters. This includes:
        -   Number of bedrooms or bathrooms (e.g., "3 bedrooms", "more than 2 baths")
        -   Specific prices or price ranges (e.g., "under 500k", "around 2 million")
        -   Crime scores, flood risk levels.
        -   Whether it's a new home.
    3.  Keep descriptive adjectives and location information as they are crucial for semantic meaning.

    Examples:
    - Raw Query: "show me detached houses with at least 4 bedrooms for under 800k in Bristol"
    - Semantic Query: "detached houses in Bristol"

    - Raw Query: "I'm looking for a modern, 2-bedroom flat with low crime, preferably a new build"
    - Semantic Query: "modern flat"

    - Raw Query: "what are some cheap family homes with more than 2 bathrooms?"
    - Semantic Query: "family homes"

    - Raw Query: "properties in cambridge"
    - Semantic Query: "properties in cambridge"

    Now, please refine the following query. Output ONLY the semantic query and nothing else.

    Raw Query: "{query}"
    Semantic Query:
    """

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        semantic_query = response.choices[0].message.content.strip()
        return semantic_query if semantic_query else query
    except Exception as e:
        print(f"Error generating semantic query: {e}")
        return query


