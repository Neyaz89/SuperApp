FROM node:20-alpine

# Updated: 2026-02-05 - Added Puppeteer/Chromium for Terabox
# Install system dependencies including Chromium for Puppeteer
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && pip3 install --break-system-packages --no-cache-dir --upgrade yt-dlp

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create cookies directory and copy authentication files
RUN mkdir -p /app/cookies
COPY cookies.txt /app/cookies.txt
COPY cookies/terabox_cookies.txt /app/cookies/terabox_cookies.txt

# Make Python scripts executable
RUN chmod +x /app/ytdlp_extract.py /app/terabox_extract.py

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
