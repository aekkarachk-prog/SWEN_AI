const request = require('supertest');
// สมมติว่าไฟล์หลักของ API คุณชื่อ server.js หรือ app.js
// แนะนำให้ใน server.js มีการแยกตัวแปร app ออกมาด้วย module.exports = app;
const app = require('../server'); 

describe('POST /api/login - Test Cases', () => {
  
  // Test Case 1: กรณีสำเร็จ
  it('✅ ควรคืนค่า 200 และมี Token เมื่อข้อมูลถูกต้อง', async () => {
    const res = await request(app)
      .post('/api/login') // เปลี่ยน URL ให้ตรงกับ Route ของคุณ
      .send({
        username: 'doctor_somchai',
        password: 'password123'
      });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  // Test Case 2: รหัสผ่านผิด
  it('❌ ควรคืนค่า 401 เมื่อรหัสผ่านผิด', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'doctor_somchai',
        password: 'wrongpassword'
      });
      
    expect(res.statusCode).toEqual(401);
  });

  // Test Case 3: ไม่ใส่ข้อมูล
  it('❌ ควรคืนค่า 400 เมื่อไม่ส่ง Username หรือ Password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'doctor_somchai'
        // ลืมส่งรหัสผ่าน
      });
      
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

});