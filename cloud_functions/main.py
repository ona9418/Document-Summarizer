import functions_framework #used for writing cloud functions
import firebase_admin
from firebase_admin import firestore
import uuid
from ocr_handler import *
from summarizer import *
import os
import logging

@functions_framework.cloud_event
def extract_text(cloud_event):
    try:
        firebase_admin.initialize_app()
        db=firestore.client()

        logging.info(f"GCS_UPLOADED={os.environ.get('GCS_UPLOADED')}")
        logging.info(f"GCS_OUTPUT={os.environ.get('GCS_OUTPUT')}")
        
        
        data= cloud_event.data
        bucket = data["bucket"]
        name=data["name"]#file name
        gcs_uri=f"gs://{bucket}/{name}"
        print(f"Processing file: {gcs_uri}")
        doc_id = str(uuid.uuid4())  # id is unique uuid for each uploaded file

        print(f"Extracting text from {gcs_uri}")
        text=extract_text_from_gcs(gcs_uri,filename=name)
        print("Summarizing text...")
        summary=summarize_text(text)
        print("Summarization complete")
        print(f"Summary: {summary}")
        
        doc_reference=db.collection("documents").document(doc_id)
        #document metadata in firestore
        doc_reference.set({
            "filename": name,
            "gcs_path":gcs_uri,
            "text": text,
            "summary":summary,
            "ocrStatus": "DONE"
        },merge=True)
        print("Document saved: ",doc_id)
        return "OK"
    except Exception as e:
        print("Error: ",e)
        return "FAIL"