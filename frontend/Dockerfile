# ใช้ Node.js เพื่อรัน Dev Server (แก้โค้ดแล้วเปลี่ยนทันที)
FROM node:18-alpine

WORKDIR /app

# Copy ไฟล์ Config มาลง Library
COPY package*.json ./
RUN npm install

# Copy โค้ดทั้งหมด
COPY . .

# เปิด Port 3000 (เพื่อให้ Gateway มองเห็น)
EXPOSE 3000

# สั่งรัน React ในโหมดพัฒนา
CMD ["npm", "start"]