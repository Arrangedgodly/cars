import os
import firebase_admin
import cloudinary
import cloudinary.uploader
import cloudinary.api
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# --- Configuration ---
SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json'
COLLECTION_NAME = 'cars'
IMAGES_DIR = 'images'
CLOUDINARY_FOLDER = 'cars_collection' # Optional: A folder to store images in Cloudinary
# ---------------------

def main():
    # 1. Load Environment Variables (for Cloudinary)
    load_dotenv()
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')

    if not all([cloud_name, api_key, api_secret]):
        print("Error: Cloudinary credentials not found in .env file.")
        print("Please create a .env file with CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.")
        return

    # 2. Initialize Services
    try:
        # Check if Firebase app is already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Successfully connected to Firebase.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return

    try:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        print("Successfully connected to Cloudinary.")
    except Exception as e:
        print(f"Error initializing Cloudinary: {e}")
        return

    # 3. Get list of local images
    try:
        local_images = [f for f in os.listdir(IMAGES_DIR) if os.path.isfile(os.path.join(IMAGES_DIR, f)) and not f.startswith('.')]
        if not local_images:
            print(f"No images found in the '{IMAGES_DIR}' directory. Did you run the download script first?")
            return
        print(f"Found {len(local_images)} images to process.")
    except FileNotFoundError:
        print(f"Error: Directory not found: '{IMAGES_DIR}'. Please run the download script first.")
        return

    # 4. Loop, Upload, and Update
    success_count = 0
    fail_count = 0
    db_collection = db.collection(COLLECTION_NAME)

    for filename in local_images:
        # Parse the Document ID from the filename
        doc_id = os.path.splitext(filename)[0]
        filepath = os.path.join(IMAGES_DIR, filename)
        
        print(f"\nProcessing: {filename} (Doc ID: {doc_id})")

        try:
            # --- Step 1: Fetch Firestore document to get context ---
            print(f"  Fetching Firestore data for doc: {doc_id}...")
            doc_ref = db_collection.document(doc_id)
            doc = doc_ref.get()

            if not doc.exists:
                print(f"  [Error] Document {doc_id} not found in Firestore. Skipping.")
                fail_count += 1
                continue

            data = doc.to_dict()
            character_name = data.get('name')
            series_name = data.get('series')

            if not all([character_name, series_name]):
                print(f"  [Error] Document {doc_id} is missing 'name' or 'series' field. Skipping.")
                fail_count += 1
                continue
            
            # Build the context dictionary. Cloudinary values must be strings.
            upload_context = {
                "character": str(character_name),
                "series": str(series_name)
            }

            # --- Step 2: Upload to Cloudinary with context ---
            print(f"  Uploading to Cloudinary with context: {upload_context}...")
            upload_response = cloudinary.uploader.upload(
                filepath,
                public_id=doc_id,
                folder=CLOUDINARY_FOLDER,
                overwrite=True,
                context=upload_context 
            )
            
            secure_url = upload_response.get('secure_url')
            public_id = upload_response.get('public_id')
            
            if not secure_url:
                raise Exception("Cloudinary response did not contain a 'secure_url'.")

            print(f"  Upload successful: {secure_url}")

            # --- Step 3: Update Firestore Document (No change needed) ---
            print(f"  Updating Firestore document: {doc_id}...")
            
            cloudinary_data = {
                "public_id": public_id,
                "secure_url": secure_url,
                "version": upload_response.get('version'),
                "format": upload_response.get('format'),
                "resource_type": upload_response.get('resource_type'),
                "uploaded_at": firestore.SERVER_TIMESTAMP
            }
            
            doc_ref.update({
                "cloudinary": cloudinary_data
            })
            
            print("  Firestore update successful.")
            success_count += 1

        except FileNotFoundError:
            print(f"  [Error] Local file not found: {filepath}. Skipping.")
            fail_count += 1
        except Exception as e:
            print(f"  [Error] Failed to process {filename}: {e}")
            fail_count += 1

    # 5. Final Summary
    print("\n--- Upload Summary ---")
    print(f"Successful uploads & updates: {success_count}")
    print(f"Failed uploads:               {fail_count}")
    print("------------------------")


if __name__ == "__main__":
    main()