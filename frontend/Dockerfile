# ใช้ Node.js เวอร์ชัน 20 (Alpine เพื่อให้ขนาดไฟล์เล็ก)
FROM node:20-alpine

# ตั้งค่า Working Directory ภายใน Container
WORKDIR /app

# ก๊อปปี้ไฟล์ package.json มาก่อนเพื่อติดตั้ง dependencies
COPY package*.json ./

# ติดตั้งแพ็กเกจ
RUN npm install

# ก๊อปปี้โค้ดทั้งหมดเข้ามาใน Container
COPY . .

# เปิด Port 3000
EXPOSE 3000

# รันโหมด Development (เพื่อให้รองรับ Hot-Reload ที่ตั้งไว้ใน Nginx)
CMD ["npm", "run", "dev"]