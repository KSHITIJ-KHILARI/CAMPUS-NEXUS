import os
from dotenv import load_dotenv
load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import logging

logger = logging.getLogger(__name__)

# Attempt to initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        project_id = os.getenv("FIREBASE_PROJECT_ID", "campus-nexus-v2")
        sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        
        if os.getenv("FIRESTORE_EMULATOR_HOST"):
            # Mock credentials for emulator
            cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "..", "..", "dummy_service_account.json"))
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
            })
            logger.info(f"Initialized Firebase Admin for project: {project_id} (EMULATOR MODE)")
        elif sa_path and os.path.exists(sa_path):
            try:
                cred = credentials.Certificate(sa_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': project_id,
                })
                logger.info(f"Initialized Firebase Admin using service account: {sa_path}")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin from service account: {e}")
        else:
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {
                    'projectId': project_id,
                })
                logger.info(f"Initialized Firebase Admin for project: {project_id} using ADC")
            except Exception as e:
                logger.warning(f"Failed to initialize Firebase Admin using ADC: {e}. Falling back to uncredentialed initialization for token verification.")
                try:
                    firebase_admin.initialize_app(options={'projectId': project_id})
                    logger.info("Initialized uncredentialed Firebase app (Auth verification only).")
                except Exception as ex:
                    logger.error(f"Total failure to initialize Firebase: {ex}")

initialize_firebase()

# Lazy initialization or graceful fallback for clients
try:
    if firebase_admin._apps:
        db = firestore.client()
    else:
        db = None
except Exception as e:
    logger.error(f"Failed to initialize Firestore client: {e}")
    db = None

auth_client = auth
storage_client = storage
