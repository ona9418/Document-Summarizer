import os
import logging

# --- Corrected Import ---
from google import genai
# We import APIError from the expected path. If this fails again, 
# it confirms the library installation is the root cause.
from google.genai.errors import APIError # Keeping this import as it should be correct
# ------------------------

# Set up logging for better error visibility
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Check for API Key
if "GEMINI_API_KEY" not in os.environ:
    logger.error("GEMINI_API_KEY environment variable not found. Please set it.")
    
try:
    # Initialize the Gemini client (will automatically use the GEMINI_API_KEY)
    client = genai.Client()
except Exception as e:
    logger.error(f"Error initializing Gemini client: {e}")
    client = None


def abstractive_summary(text_content: str) -> str:
    # Generates an abstractive summary of the input text using the Gemini API.
    if not client:
        return (
            "ERROR: Gemini API Client failed to initialize. "
            "Please ensure the 'google-genai' package is installed and "
            "the GEMINI_API_KEY environment variable is correctly set."
        )

    # Define the summarization prompt
    prompt = (
        "You are an expert technical summarizer. Analyze the following document text, "
        "which may contain complex jargon or be lengthy, and create a single, concise, "
        "and coherent abstractive summary. The summary should capture the main ideas "
        "and important details, making the text easier to understand. The target length "
        "should be approximately 20% of the original text length, or less if possible. "
        "Document Text:\n\n"
        f"--- START DOCUMENT ---\n{text_content}\n--- END DOCUMENT ---"
    )
    
    try:
        # Call the Gemini API with the appropriate model
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                "system_instruction": "Generate a concise and coherent abstractive summary.",
                "max_output_tokens": 1024
            }
        )
        
        # Return the generated text
        return response.text

    except APIError as e:
        logger.error(f"Gemini API Error: {e}")
        return f"ERROR: Failed to generate summary due to Gemini API issue. Details: {e}"
    except Exception as e:
        logger.error(f"An unexpected error occurred during summarization: {e}")
        return f"ERROR: An unexpected error occurred. Details: {e}"