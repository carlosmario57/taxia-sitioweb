import firebase_admin
import os
import google.generativeai as genai
import json
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from datetime import datetime

# Initialize the Firebase Admin SDK.
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {
        'projectId': os.getenv('GCLOUD_PROJECT')
    })

db = firestore.client()

# Configure the Gemini API key from environment variables for security.
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model.
generation_model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')

# Initialize the Flask web server.
app = Flask(__name__)

@app.route('/', methods=['POST'])
def process_message():
    """
    Processes an incoming HTTP POST request (webhook).
    It extracts a text message, uses the Gemini AI to interpret it as a taxi request,
    and then saves the trip details to a Firestore database.
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided in the request'}), 400

        user_message = data['text']
        user_id = data.get('userId', 'anonymous')

        # Define the JSON response schema for Gemini. This ensures a predictable output.
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "origin": {"type": "STRING"},
                "destination": {"type": "STRING"}
            },
            "required": ["origin", "destination"]
        }
        
        # Prepare the prompt for the AI.
        prompt = (
            f"Analyze the following taxi request and extract the origin and destination addresses. "
            f"If the message is not a taxi request, do not extract anything. "
            f"The user's message is: '{user_message}'"
        )

        # Call the Gemini API to generate content based on the prompt.
        response = generation_model.generate_content(
            contents=[{'role': 'user', 'parts': [{'text': prompt}]}],
            generation_config={"response_mime_type": "application/json", "response_schema": response_schema}
        )

        # Parse the AI's JSON response.
        try:
            travel_data = response.candidates[0].content.parts[0].text
            travel_info = json.loads(travel_data)
        except (IndexError, json.JSONDecodeError):
            return jsonify({'message': 'Could not understand the request. Please be more specific.'}), 200

        origin_address = travel_info.get('origin')
        destination_address = travel_info.get('destination')

        # If origin or destination were not found, inform the user.
        if not origin_address or not destination_address:
            return jsonify({'message': 'The message does not appear to be a taxi request.'}), 200

        # Create a new document in the 'travels' collection in Firestore.
        travel_doc = {
            'originAddress': origin_address,
            'destinationAddress': destination_address,
            'status': 'pending',
            'createdAt': datetime.now(),
            'passengerId': user_id,
        }
        
        doc_ref = db.collection(f'artifacts/{os.getenv("GCLOUD_PROJECT")}/public/data/travels').document()
        doc_ref.set(travel_doc)

        print(f"Trip created successfully: {doc_ref.id}")

        return jsonify({'message': 'Your taxi request has been received and is being processed.'}), 200

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500
