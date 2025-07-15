import json
import requests

def handler(request, response):
    token = request.query.get('token')
    if not token:
        return response.json({"error": "Token is required"}, status=400)

    url = f'https://graph.facebook.com/me?access_token={token}'
    try:
        r = requests.get(url)
        data = r.json()
        if 'error' in data:
            return response.json({"valid": False, "error": data['error']['message']})

        return response.json({
            "valid": True,
            "user_id": data.get("id"),
            "name": data.get("name"),
            "email": data.get("email", "N/A")
        })
    except Exception as e:
        return response.json({"error": str(e)}, status=500)
