# Use official Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
# Install system dependencies for python-docx/spacy if needed
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port uvicorn runs on
EXPOSE 8080

# Command to run the application
# Note: Cloud Run expects port 8080 by default, so we tell uvicorn to use it
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]