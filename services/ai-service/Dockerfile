# ใช้ Python เวอร์ชัน Slim (ตัดขยะออกเกือบหมด)
FROM python:3.9-slim

WORKDIR /app

# ป้องกัน Python เขียนไฟล์ .pyc (รก)
ENV PYTHONDONTWRITEBYTECODE 1
# ให้ Log ออกมาที่ Terminal ทันที (ไม่ต้องรอ Buffer)
ENV PYTHONUNBUFFERED 1

# Install Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Code
COPY . .

# Expose Port 5000
EXPOSE 5000

# Start FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]