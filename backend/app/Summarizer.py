import os
import logging
from google import genai
from google.genai.errors import APIError

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Check for API Key
if "GEMINI_API_KEY" not in os.environ:
    logger.error("GEMINI_API_KEY environment variable not found. Please set it.")
    
try:
    client = genai.Client()
except Exception as e:
    logger.error(f"Error initializing Gemini client: {e}")
    client = None

def abstractive_summary(text_content: str, length_mode: str = "medium") -> str:
    """
    Generates an abstractive summary of the input text using the Gemini API.
    length_mode options: 'short' (25%), 'medium' (50%), 'long' (70%)
    """
    if not client:
        return "ERROR: Gemini API Client failed to initialize."

    # Adjust prompts based on user preference
    length_instruction = {
        "short": "The target length should be approximately 15% of the original text length.",
        "medium": "The target length should be approximately 25% of the original text length.",
        "long": "The target length should be approximately 55% of the original text length."
    }

    # Default to medium if mode is unrecognized
    instruction = length_instruction.get(length_mode, length_instruction["medium"])

    prompt = (
        "You are an expert technical summarizer. Analyze the following document text. "
        f"{instruction}\n\n"
        "Document Text:\n"
        f"--- START DOCUMENT ---\n{text_content}\n--- END DOCUMENT ---"
    )
    
    try:
        # Determine max tokens based on length mode
        max_tokens = 4096 if length_mode in ["medium", "long"] else 1024

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                "system_instruction": "Generate a concise and coherent abstractive summary.",
                "max_output_tokens": max_tokens
            }
        )
        return response.text

    except APIError as e:
        logger.error(f"Gemini API Error: {e}")
        return f"ERROR: Failed to generate summary. Details: {e}"
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return f"ERROR: An unexpected error occurred. Details: {e}"