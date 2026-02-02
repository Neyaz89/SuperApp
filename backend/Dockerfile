FROM python:3.11-slim

WORKDIR /app

# Install yt-dlp and dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir yt-dlp flask flask-cors

# Copy application
COPY app.py .

EXPOSE 8080

CMD ["python", "app.py"]
