# ใช้ Python 3.10
FROM python:3.10-slim

WORKDIR /app

# ก๊อปปี้ไฟล์ requirements.txt และติดตั้งไลบรารี
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# ก๊อปปี้โค้ดและโมเดลทั้งหมด
COPY . .

# เปิด Port 5000 (ภายใน Docker Network)
EXPOSE 5000

# รัน FastAPI
CMD ["python", "app.py"]