# ใช้ Python เวอร์ชัน Slim (ตัดขยะออกเกือบหมด)
FROM python:3.9-slim

WORKDIR /app

# ป้องกัน Python เขียนไฟล์ .pyc (รก)
ENV PYTHONDONTWRITEBYTECODE 1
# ให้ Log ออกมาที่ Terminal ทันที (ไม่ต้องรอ Buffer)
ENV PYTHONUNBUFFERED 1

# ลง Library ที่จำเป็นสำหรับ OS (ถ้า TensorFlow ต้องการ)
# ถ้าไม่จำเป็น ลบบรรทัด RUN apt-get... ทิ้งได้เลยจะยิ่งเล็ก
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# --no-cache-dir  ไม่เก็บไฟล์ติดตั้งไว้ในเครื่อง
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดแอปทั้งหมดลงใน Container
COPY . .
# เปิดพอร์ตที่แอปจะรัน
EXPOSE 5000
# สั่งรันแอป
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]