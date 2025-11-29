from dotenv import load_dotenv
load_dotenv()
import os
import uuid
from google.cloud import vision,storage
from google.cloud.vision_v1 import types
import json                                           
import logging
vision_client=vision.ImageAnnotatorClient()
storage_client = storage.Client()
def extract_text_from_gcs(gcs_uri:str,filename:str)->str:
    ext=os.path.splitext(filename)[1].lstrip(".").lower()

    if ext in ["png", "jpg", "jpeg"]:
        return extract_text_from_image(gcs_uri)
    elif ext=="pdf":
        return extract_text_from_pdf(gcs_uri)
    else:
        logging.error("extension {ext} in {filename} is not supported")
        raise ValueError(" {ext}")
    
def extract_text_from_image(gcs_uri:str):
    image=vision.Image()
    image.source.image_uri=gcs_uri

    response= vision_client.document_text_detection(image=image)
    if response.error.message:
        raise RuntimeError(response.error.message)
    return response.full_text_annotation.text or ""

def extract_text_from_pdf(gcs_uri:str)->str:
    # Vision async requires a GCS output bucket
    logging.info(f"Env variables: {os.environ.get('GCS_OUTPUT')}")
    print(f"Env variables: {os.environ.get('GCS_OUTPUT')}")
    output_bucket_name = os.environ.get('GCS_OUTPUT')
    if not output_bucket_name:
        raise RuntimeError("GCS_OUTPUT is not set")

    output_prefix = f"ocr-results-{uuid.uuid4().hex}"#in case of concurrency

    mime_type = "application/pdf"
    features = [{"type": vision.Feature.Type.DOCUMENT_TEXT_DETECTION}]

    request = {
        "input_config": {
            "gcs_source": {"uri": gcs_uri},
            "mime_type": mime_type,
        },
        "features": features,
        "output_config": {
            "gcs_destination": {"uri": f"gs://{output_bucket_name}/{output_prefix}/"}
        }
    }

    # run async operation
    operation = vision_client.async_batch_annotate_files(requests=[request])
    logging.info(f"Started OCR operation for {gcs_uri}, waiting for result...")
    operation.result(timeout=300)#gives time for text extraction due to asynchronous operattion before
    logging.info("OCR operation completed")
    # The output is written as JSON to GCS
    output_bucket = storage_client.bucket(output_bucket_name)

    # locate OCR result file
    blob_list = list(output_bucket.list_blobs(prefix=output_prefix))

    if not blob_list:
        raise RuntimeError("No OCR output found in output bucket.")
    #sort blobs to account for multiple pages
    blob_list.sort(key=lambda b: b.name)


    text=""
    for blob in blob_list:
        # Parse Vision result JSON
        content = blob.download_as_bytes()
        data = json.loads(content)

        for page_response in data.get("responses", []):
            annotation = page_response.get("fullTextAnnotation")
            if annotation:
                text += annotation.get("text", "") + "\n"

    logging.info("Extraction Complete")
    return text
