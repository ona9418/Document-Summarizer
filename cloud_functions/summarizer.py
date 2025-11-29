

def summarize_text(text: str) -> str:
    from google import genai
    import os
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    prompt = f"""
    Summarize the following text into clear, concise bullet points.
    Keep the total length under 15% of the original text. Do not restate this prompt.

    TEXT:
    {text}
    """

    response = client.models.generate_content(
        model="gemma-3-27b-it",
        contents=prompt
    )

    return response.text.strip()
