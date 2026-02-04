FROM node:20-alpine

# Install yt-dlp and dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && pip3 install --break-system-packages --no-cache-dir --upgrade yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Copy cookies files for authentication
COPY cookies.txt /app/cookies.txt
COPY terabox_cookies.txt /app/terabox_cookies.txt

# Make Python scripts executable
RUN chmod +x /app/ytdlp_extract.py /app/terabox_extract.py

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
