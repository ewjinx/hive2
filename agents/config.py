# Agent Configuration
import json
import os

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agent_settings.json")

# Defaults
AGENT_NAME = "HiveAgent-Default"
API_URL = "http://localhost:8000/api/v1"
TOKEN = ""
AGENTS = []


def load_config():
    """Load config from agent_settings.json."""
    global API_URL, TOKEN, AGENTS
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                data = json.load(f)
            API_URL = data.get("API_URL", API_URL)
            TOKEN = data.get("TOKEN", "")
            AGENTS = data.get("AGENTS", [])
        except Exception as e:
            print(f"Warning: Could not load config: {e}")


def save_config(token=None, agents=None):
    """Save config to agent_settings.json."""
    global TOKEN, AGENTS
    if token is not None:
        TOKEN = token
    if agents is not None:
        AGENTS = agents

    data = {
        "API_URL": API_URL,
        "TOKEN": TOKEN,
        "AGENTS": AGENTS,
    }
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        print(f"Warning: Could not save config: {e}")


# Load on import
load_config()
