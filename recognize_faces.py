import os
import face_recognition
import pickle
import numpy as np
import io
import base64
import requests
import json
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load face encodings from file
def load_face_encodings(encoding_file):
    with open(encoding_file, 'rb') as f:
        known_faces = pickle.load(f)
    return known_faces

# Function to recognize faces and return both names and face locations
def recognize_faces(known_faces, image, tolerance=0.5):
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)
    identified_people_with_locations = []

    for i, face_encoding in enumerate(face_encodings):
        best_match_name = "Unknown"
        best_match_distance = tolerance
        
        for person_name, encodings_list in known_faces.items():
            distances = face_recognition.face_distance(encodings_list, face_encoding)
            min_distance = np.min(distances)
            
            if min_distance < best_match_distance:
                best_match_distance = min_distance
                best_match_name = person_name

        identified_people_with_locations.append({
            'name': best_match_name,
            'location': face_locations[i]
        })

    return identified_people_with_locations

# Function to encode image for Llava
def encode_image(image_path):
    with Image.open(image_path) as img:
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

# Generate caption using Llava, identified people, and their locations
def generate_llava_caption(image_path, identified_people_with_locations):
    try:
        encoded_image = encode_image(image_path)

        # Step 1: Get general description without mentioning names
        initial_prompt = ("Describe this image in detail, including the setting, activities, objects, and overall context. "
                          "Do not identify or name any specific individuals, but do mention the number of people you see "
                          "and describe their general appearance and actions. "
                          "This description should be suitable for a visually impaired person.")

        initial_payload = json.dumps({
            "model": "llava",
            "prompt": initial_prompt,
            "images": [encoded_image],
            "stream": False,
        })

        initial_response = requests.post(
            "http://localhost:11434/api/generate",
            data=initial_payload,
            headers={"Content-Type": "application/json"}
        )

        if initial_response.status_code == 200:
            initial_description = initial_response.json()["response"]
        else:
            raise Exception(f"Error in initial Llava request: {initial_response.status_code}")

        # Step 2: Incorporate identified names and their locations into the description
        detailed_description = []
        known_names = []
        for person in identified_people_with_locations:
            name = person['name']
            if name != "Unknown":
                detailed_description.append(f"{name} is one of the people in the image.")
                known_names.append(name)
            else:
                detailed_description.append("There is an unidentified person in the image.")

        people_str = " ".join(detailed_description)
        print("People identified for caption:", people_str)
        print("Known names:", known_names)

        final_prompt = (f"Here is a general description of an image: '{initial_description}' "
                        f"The following information about people in this image is known: {people_str} "
                        f"Please rewrite the description, incorporating the following rules strictly:"
                        f"1. Use the names {', '.join(known_names)} for the identified individuals. "
                        f"2. For any person not identified by name, refer to them as 'a person' or use descriptors like 'a man', 'a woman', etc. "
                        f"3. Do not invent or generate any names not provided in the list above. "
                        f"4. Ensure the description flows naturally and describes the scene for a visually impaired person. "
                        f"5. Do not mention anything technical about the image or this process. "
                        f"6. If no names were provided, do not use any names in your description. "
                        f"7. Make sure to incorporate all the provided names ({', '.join(known_names)}) into your description, "
                        f"replacing general references to people with their specific names where appropriate. "
                        f"8. The final description should sound natural and not like a list of facts.")

        final_payload = json.dumps({
            "model": "llava",
            "prompt": final_prompt,
            "stream": False,
        })

        final_response = requests.post(
            "http://localhost:11434/api/generate",
            data=final_payload,
            headers={"Content-Type": "application/json"}
        )

        if final_response.status_code == 200:
            return final_response.json()["response"]
        else:
            raise Exception(f"Error in final Llava request: {final_response.status_code}")

    except Exception as e:
        print(f"An error occurred: {e}")
        return f"Error generating caption: {str(e)}"

# Combine face recognition with Llava caption generation
def generate_final_caption(known_faces, test_image_path):
    image = face_recognition.load_image_file(test_image_path)
    identified_people_with_locations = recognize_faces(known_faces, image)
    return generate_llava_caption(test_image_path, identified_people_with_locations)

# Load the uploaded test image from the test directory
if __name__ == "__main__":
    encoding_file = "encodings/known_faces_encodings.pkl"  # Path to the saved encodings
    
    # Find the most recently uploaded test image
    test_dir = "public/test"  # Directory for test images
    try:
        # List all files in the test directory and sort them by modification time
        files = sorted(
            [f for f in os.listdir(test_dir) if os.path.isfile(os.path.join(test_dir, f))],
            key=lambda x: os.path.getmtime(os.path.join(test_dir, x))
        )
        if files:
            # Get the most recently uploaded test image
            test_image_name = files[-1]  # The last file is the most recently uploaded
            test_image_path = os.path.join(test_dir, test_image_name)

            print(f"Using test image: {test_image_path}")

            known_faces = load_face_encodings(encoding_file)
            final_caption = generate_final_caption(known_faces, test_image_path)
            print("Final Caption:", final_caption)
        else:
            print("No test images found in the test directory.")

    except Exception as e:
        print(f"An error occurred while processing test images: {e}")