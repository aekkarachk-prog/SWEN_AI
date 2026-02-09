#ทดสอบสร้าง Docker ไม่ใช้ของจริง code ไว้เปลี่ยนแปลงเมื่อพร้อมใช้งาน

from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "status": "active",
        "service": "AI Inference Service",
        "model_loaded": False  # เดี๋ยวค่อยมาเขียน Logic โหลด Model ตรงนี้
    }

# Health Check Endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Run Server (ถ้าสั่ง python app.py ตรงๆ)
# แต่ปกติ Docker จะรันผ่านคำสั่ง uvicorn ใน Dockerfile อยู่แล้ว
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)