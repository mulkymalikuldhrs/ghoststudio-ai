FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY run.py .
COPY webapp.py .
COPY static/ ./static/
COPY templates/ ./templates/
COPY fonts/ ./fonts/

# Create output directory
RUN mkdir -p /app/clips

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:5000/ || exit 1

# Start Flask server
CMD ["python", "webapp.py"]
