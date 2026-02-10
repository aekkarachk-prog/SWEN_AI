# Base Image: เลือกใช้ Alpine เพราะเล็กและปลอดภัย (ขนาด < 100MB)
FROM node:18-alpine AS builder

# Set Working Directory
WORKDIR /app

# Copy เฉพาะ package.json ก่อน (เพื่อใช้ Docker Cache Layer)
# ถ้า dependencies ไม่เปลี่ยน Docker จะข้ามขั้นตอนนี้ไปเลย ทำให้ Build เร็วมาก
COPY package*.json ./

# Install Dependencies
RUN npm install

# Copy Source Code ทั้งหมด
COPY . .

FROM node:18-alpine
WORKDIR /app
# Copy เฉพาะโฟลเดอร์ node_modules ที่จำเป็นจาก Stage 1 มา
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
# (Copy ไฟล์อื่นๆ ที่จำเป็น เช่น .env.example หรือ folder src)

# สร้าง User ใหม่เพื่อความปลอดภัย (ไม่ใช้ Root)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
# Start the server
CMD ["npm", "start"]