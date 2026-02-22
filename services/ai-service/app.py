from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
import torch
import torchvision.transforms as transforms
from PIL import Image
import timm

app = FastAPI(title="Alzheimer Diagnosis AI Service")

# อนุญาตให้ Backend Core เรียกใช้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 🧠 1. โหลดโครงสร้างโมเดลและยัด Weights (state_dict)
# ---------------------------------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = "model/efficientnetb0_alzheimer.pt"

try:
    # 1.1 สร้างโครงสร้าง EfficientNetB0 เปล่าๆ ขึ้นมาก่อน (num_classes=4 ตามที่เทรน)
    model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=4)
    
    # 1.2 โหลดไฟล์ .pt ที่เป็น Dictionary
    checkpoint = torch.load(model_path, map_location=device)
    
    # 1.3 เอา Weights (state_dict) ใส่เข้าไปในโมเดล
    model.load_state_dict(checkpoint["model_state_dict"])
    
    model.to(device)
    model.eval() # เปลี่ยนเป็นโหมดทำนายผล
    print("✅ Model loaded successfully!")
    
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# ---------------------------------------------------------
# 🖼️ 2. ตั้งค่า Image Transform ให้ตรงกับตอนเทรนเป๊ะๆ
# ---------------------------------------------------------
transform = transforms.Compose([
    transforms.Resize((128, 128)), # ตอนเทรนใช้ 128
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]) # ค่า Mean/Std ตาม Notebook
])

# ลำดับคลาสตามตัวแปร class_names ใน Notebook
CLASSES = ['Mild Demented', 'Moderate Demented', 'Non Demented', 'Very Mild Demented']

@app.get("/")
def read_root():
    return {"status": "AI Service is running", "device": str(device)}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded properly. Check server logs."}

    try:
        # อ่านไฟล์รูปภาพและแปลงโหมดสีเป็น RGB
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # แปลงเป็น Tensor และเพิ่มมิติ Batch
        img_tensor = transform(image).unsqueeze(0).to(device)
        
        # ---------------------------------------------------------
        # 🤖 3. ส่งเข้าโมเดลทำนายผล
        # ---------------------------------------------------------
        with torch.no_grad():
            outputs = model(img_tensor)
            # แปลงผลลัพธ์เป็นเปอร์เซ็นต์ด้วย Softmax
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
            
        # หาคลาสที่คะแนนสูงสุด
        predicted_idx = torch.argmax(probabilities).item()
        predicted_class = CLASSES[predicted_idx]
        
        # ดึงค่าความน่าจะเป็นรายคลาส (คูณ 100 เพื่อให้เป็น %)
        prob_dict = {
            "mild": round(probabilities[0].item() * 100, 2),
            "moderate": round(probabilities[1].item() * 100, 2),
            "non": round(probabilities[2].item() * 100, 2),
            "very_mild": round(probabilities[3].item() * 100, 2)
        }

        return {
            "prediction": predicted_class,
            "probabilities": prob_dict,
            "filename": file.filename
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)