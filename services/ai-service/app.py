from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import random
import time
import uvicorn

app = FastAPI(title="Alzheimer Diagnosis AI Service")

# อนุญาตให้ Backend Core เรียกใช้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "AI Service is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # อ่านไฟล์รูปภาพ (เพื่อยืนยันว่าได้รับไฟล์จริง)
    contents = await file.read()
    
    # หน่วงเวลาจำลองการประมวลผลของ AI 1.5 วินาที
    time.sleep(1.5)
    
    # ---------------------------------------------------------
    # TODO: แทรกโค้ดโหลดโมเดล PyTorch (efficientnetb0_alzheimer.pt) 
    # และประมวลผลรูปภาพ (contents) ตรงนี้
    # ---------------------------------------------------------

    # MOCK DATA: จำลองผลลัพธ์ที่จะส่งกลับไป (สุ่มความน่าจะเป็น)
    # สมมติให้ 'Mild' มีค่าสูงเพื่อจำลองเคสที่เจอโรค
    mock_mild_prob = random.uniform(70.0, 95.0)
    mock_non_prob = random.uniform(0.0, 10.0)
    mock_very_mild_prob = random.uniform(0.0, 15.0)
    mock_moderate_prob = 100.0 - (mock_mild_prob + mock_non_prob + mock_very_mild_prob)

    return {
        "prediction": "Mild Demented",
        "probabilities": {
            "non": round(mock_non_prob, 2),
            "very_mild": round(mock_very_mild_prob, 2),
            "mild": round(mock_mild_prob, 2),
            "moderate": round(abs(mock_moderate_prob), 2)
        },
        "filename": file.filename
    }

if __name__ == "__main__":
    # รันเซิร์ฟเวอร์ที่ Port 5000 (เปิดรับ request จากทุก IP ในวง Docker)
    uvicorn.run(app, host="0.0.0.0", port=5000)