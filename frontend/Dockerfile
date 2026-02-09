FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# เปิด Port 3000
EXPOSE 3000

# คำสั่งรัน React
CMD ["npm", "start"]