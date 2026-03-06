# ใช้ Python 3.10
FROM python:3.10-slim

WORKDIR /app

# install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy source code
COPY . .

# Cloud Run ใช้ port 8080
ENV PORT=8080
EXPOSE 8080

# run FastAPI
CMD ["python", "app.py"]