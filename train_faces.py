import os
import face_recognition
import pickle
import numpy as np  # noqa: F401
import sys
print("Python executable:", sys.executable)
# Function to load and encode faces for a person from multiple images
def get_face_encodings(image_folder):
    encodings = []
    
    # Loop through each image in the person's folder
    for filename in os.listdir(image_folder):
        if filename.endswith(".jpg") or filename.endswith(".jpeg"):
            image_path = os.path.join(image_folder, filename)
            image = face_recognition.load_image_file(image_path)
            
            # Get face encodings (assuming one face per image)
            face_encoding = face_recognition.face_encodings(image)
            if face_encoding:  # If a face is found in the image
                encodings.append(face_encoding[0])
    
    return encodings

# Function to encode and save known faces
def encode_known_faces(known_people_folder, output_file):
    known_faces = {}

    # Loop through each person's folder in the known_people directory
    for person_name in os.listdir(known_people_folder):
        person_folder = os.path.join(known_people_folder, person_name)
        
        if os.path.isdir(person_folder):
            encodings = get_face_encodings(person_folder)
            if encodings:
                known_faces[person_name] = encodings
    
    # Save the encodings to a file
    with open(output_file, 'wb') as f:
        pickle.dump(known_faces, f)
    
    print(f"Encodings saved to {output_file}")

if __name__ == "__main__":
    known_people_folder = "public/uploads"  # Update this to where images are uploaded
    output_file = "encodings/known_faces_encodings.pkl"
    
    # Encode faces and save to file
    encode_known_faces(known_people_folder, output_file)