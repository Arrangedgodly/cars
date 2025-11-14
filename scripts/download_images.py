"""
download_images.py 

Iterates over the cars collection in the firestore db and downloads the images to the ./images directory 

Images use their firestore doc id as their name
"""

import os
import re
import mimetypes
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# --- Configuration ---
SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json'
COLLECTION_NAME = 'cars'
OUTPUT_DIR = 'images'
ERROR_LOG_FILE = 'failed_downloads.txt'
# ---------------------

def sanitize_filename(name):
    """
    Removes characters that are invalid in filenames.
    """
    # Remove invalid characters
    s = re.sub(r'[\\/*?:"<>|]', "", name)
    # Replace spaces with underscores for readability
    s = s.replace(" ", "_")
    return s

def download_image(doc_id, url, base_filename, directory):
    """
    Downloads an image from a URL and saves it to a directory
    with a determined file extension.
    
    Returns a tuple: (success: bool, message: str)
    On success: (True, saved_filepath)
    On failure: (False, error_message)
    """
    try:
        # Add a User-Agent header to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
        }
        
        # Send a GET request to the image URL
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check if the request was successful
        response.raise_for_status() 

        # Determine the file extension from the content type
        content_type = response.headers.get('content-type')
        extension = mimetypes.guess_extension(content_type)

        # Fallback for unknown content-type (e.g., .webp shows up as 'image/webp')
        if not extension and 'image/webp' in content_type:
            extension = '.webp'
        elif not extension:
            print(f"  [Warning] Could not determine extension for {doc_id} (Type: {content_type}). Defaulting to .jpg")
            extension = '.jpg'

        # Create the full path to save the file
        filename = f"{base_filename}{extension.lower()}"
        filepath = os.path.join(directory, filename)

        # Write the image content to the file
        with open(filepath, 'wb') as f:
            f.write(response.content)
            
        return (True, filepath)

    except requests.exceptions.RequestException as e:
        return (False, str(e))
    except Exception as e:
        return (False, f"An unexpected error occurred: {e}")

def main():
    # 1. Initialize Firebase Admin
    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Successfully connected to Firebase.")
    except Exception as e:
        print(f"Error: Could not initialize Firebase. Is '{SERVICE_ACCOUNT_FILE}' correct?")
        print(e)
        return

    # 2. Create local directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory '{OUTPUT_DIR}' is ready.")

    # 3. Lists to track successes and failures
    successful_downloads = []
    failed_downloads = []
    doc_count = 0

    # 4. Get all documents from the 'cars' collection
    try:
        cars_ref = db.collection(COLLECTION_NAME)
        docs = cars_ref.stream()
        print(f"Fetching documents from '{COLLECTION_NAME}' collection...")

        for doc in docs:
            doc_count += 1
            data = doc.to_dict()
            
            # Get fields from the document
            name = data.get('name')
            series = data.get('series')
            image_url = data.get('image')

            # Validate that all required fields exist
            if not all([name, series, image_url]):
                print(f"[Skipping] Document {doc.id} is missing 'name', 'series', or 'image' field.")
                failed_downloads.append({
                    "doc_id": doc.id,
                    "name": "Unknown (Missing Fields)",
                    "url": "Unknown",
                    "error": "Document missing 'name', 'series', or 'image' field."
                })
                continue

            print(f"\nProcessing document: {doc.id} (Name: {name})")

            base_filename = doc.id
            
            # 5. Check return value and log success/failure
            success, message = download_image(doc.id, image_url, base_filename, OUTPUT_DIR)
            
            if success:
                print(f"  -> Saved as: {message}")
                successful_downloads.append(message)
            else:
                print(f"  [Error] Failed to download: {message}")
                failed_downloads.append({
                    "doc_id": doc.id,
                    "name": name,
                    "url": image_url,
                    "error": message
                })
        
    except Exception as e:
        print(f"An error occurred while fetching collection: {e}")

    finally:
        if failed_downloads:
            print(f"\nWriting {len(failed_downloads)} failure(s) to {ERROR_LOG_FILE}...")
            with open(ERROR_LOG_FILE, 'w', encoding='utf-8') as f:
                f.write(f"Failed to download {len(failed_downloads)} image(s):\n")
                f.write("=" * 40 + "\n\n")
                for item in failed_downloads:
                    f.write(f"Name:   {item['name']}\n")
                    f.write(f"Doc ID: {item['doc_id']}\n")
                    f.write(f"URL:    {item['url']}\n")
                    f.write(f"Error:  {item['error']}\n")
                    f.write("-" * 20 + "\n")
        
        # Print final summary
        print("\n--- Summary ---")
        print(f"Total documents processed: {doc_count}")
        print(f"Successful downloads:    {len(successful_downloads)}")
        print(f"Failed downloads:        {len(failed_downloads)}")
        if failed_downloads:
            print(f"See {ERROR_LOG_FILE} for details on failures.")
        print("---------------")

if __name__ == "__main__":
    main()
