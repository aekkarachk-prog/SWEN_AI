# Patient Service

## Responsibility
Patient Service ทำหน้าที่จัดการข้อมูลผู้ป่วย (Patient) ซึ่งเป็นข้อมูลศูนย์กลางของระบบ  
ทุก Service อื่น เช่น History, Diagnosis, Image จะอ้างอิงข้อมูลผู้ป่วยผ่าน `patient_id`

ขอบเขตความรับผิดชอบของ Patient Service:
- สร้างข้อมูลผู้ป่วย (Create)
- อ่านข้อมูลผู้ป่วย (Read)
- แก้ไขข้อมูลผู้ป่วย (Update)
- ลบข้อมูลผู้ป่วย (Soft Delete)
- ค้นหาข้อมูลผู้ป่วย (Search)

---

## Database Design Overview (MongoDB)
ระบบฐานข้อมูลใช้ MongoDB (NoSQL)  
ออกแบบในรูปแบบ **Reference-based Design**  
โดยกำหนดให้ `patients` เป็น collection หลัก

Service อื่นจะไม่แก้ไขข้อมูล patient โดยตรง  
แต่จะอ้างอิงผ่าน `patient_id` เท่านั้น

---

## Collections

### 1. patients (Main Collection)
ใช้เก็บข้อมูลพื้นฐานของผู้ป่วย

```json
{
  "_id": "ObjectId",
  "patient_code": "HN00123",
  "first_name": "Somchai",
  "last_name": "Jaidee",
  "gender": "male",
  "birth_date": "1955-08-20",
  "is_deleted": false,
  "created_at": "2026-02-09T10:00:00Z",
  "updated_at": "2026-02-09T10:00:00Z"
}
```

### 2. histories (อ้างอิง Patient)
จัดการโดย History Service
ใช้เก็บประวัติการวินิจฉัยย้อนหลัง

```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "diagnosis_date": "2026-02-09T11:00:00Z",
  "result": "High risk of Alzheimer",
  "created_at": "2026-02-09T11:05:00Z"
}
```

### 3. diagnoses (อ้างอิง Patient)
จัดการโดย Diagnosis / AI Service
ใช้เก็บผลการวิเคราะห์จากโมเดล AI

```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "diagnosis_result": "Alzheimer detected",
  "confidence_score": 0.92,
  "created_at": "2026-02-09T11:10:00Z"
}
```

### 4. images (อ้างอิง Patient)
จัดการโดย Image Service
ใช้เก็บข้อมูลไฟล์ภาพที่อัปโหลด

```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId",
  "image_path": "/uploads/patient_123/img01.png",
  "uploaded_at": "2026-02-09T11:08:00Z"
}
```