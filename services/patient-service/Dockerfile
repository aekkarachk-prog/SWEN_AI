# Base Image: เลือกใช้ Alpine เพราะเล็กและปลอดภัย (ขนาด < 100MB)
FROM node:18-alpine

# Set Working Directory
WORKDIR /usr/src/app

# Copy เฉพาะ package.json ก่อน (เพื่อใช้ Docker Cache Layer)
# ถ้า dependencies ไม่เปลี่ยน Docker จะข้ามขั้นตอนนี้ไปเลย ทำให้ Build เร็วมาก
COPY package*.json ./

# Install Dependencies
RUN npm install --production --silent && mv node_modules ../

# Copy Source Code ทั้งหมด
COPY . .

# Security: เปลี่ยนสิทธิ์เป็น User ธรรมดา (ไม่ใช่ Root)
# มาตรฐานโลกซีเรียสเรื่องนี้มาก ห้ามรันแอปด้วย Root ใน Container
RUN chown -R node /usr/src/app
USER node

# Expose Port (ภายใน Container)
EXPOSE 3000

# Start Command
CMD ["npm", "start"]