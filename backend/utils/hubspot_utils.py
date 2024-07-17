from hubspot import HubSpot
from decouple import config
import requests
import json

company_map = {
    "Nexus Retail": {"id": "12728866519", "client": "Alex"},
    "Efficient Operations": {"id": "12710809829", "client": "Susan"},
}

base_url = "https://api.hubapi.com/crm/v3/objects"


def get_company_properties(company_id):
    try:
        headers = {
            "Authorization": f"Bearer {config('HUBSPOT_API_KEY')}",
            "Content-Type": "application/json",
        }
        response = requests.get(
            f"{base_url}/companies/{company_id}?properties=frame_agreement_hourly_rate",
            headers=headers,
        )
        response.raise_for_status()
        company = response.json()
        return company.get("properties", {})
    except requests.exceptions.RequestException as e:
        print(f"Error fetching company properties: {e}")
        return None


def get_company_activities():
    try:
        headers = {
            "Authorization": f"Bearer {config('HUBSPOT_API_KEY')}",
            "Content-Type": "application/json",
        }
        response = requests.get(
            f"{base_url}/calls/30051852271?properties=hs_createdate", headers=headers
        )
        # print(response.json())
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching company activities: {e}")
        return None


def get_engagements():
    try:
        headers = {
            "Authorization": f"Bearer {config('HUBSPOT_API_KEY')}",
            "Content-Type": "application/json",
        }
        url = f"https://api.hubapi.com/engagements/v1/engagements/paged"
        response = requests.get(url, headers=headers)
        return response.json().get("results")
    except Exception as e:
        print(f"Error fetching engagement: {e}")
        return None


def get_company_data(company_name):
    data = {
        "emails": "",
        "calls": "",
        "hourly_rate": 0,
    }
    engs = get_engagements()
    client_name = company_map[company_name]["client"]
    for eng in engs:
        if client_name in eng.get("engagement").get("bodyPreview"):
            if eng.get("engagement").get("type") == "EMAIL":
                data["emails"] += f"\n\n{eng.get('engagement').get('bodyPreview')}"
            elif eng.get("engagement").get("type") == "CALL":
                data["calls"] += f"\n\n{eng.get('engagement').get('bodyPreview')}"

    company_properties = get_company_properties(company_map[company_name]["id"])
    data["hourly_rate"] = company_properties.get("frame_agreement_hourly_rate")
    return data
