const request = require('supertest');
const app = require('../server'); 

describe('Auth & User API - Test Cases', () => {
  let userToken = '';

  // --- Auth Tests ---
  describe('POST /api/auth/login', () => {
    it('✅ ควรคืนค่า 200 และมี Token เมื่อข้อมูลถูกต้อง', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'doctor_somchai',
          password: 'password123'
        });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('doctor_somchai');
      userToken = res.body.token; // เก็บ Token ไว้ใช้เทสต์ User API
    });

    it('❌ ควรคืนค่า 401 เมื่อรหัสผ่านผิด', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'doctor_somchai',
          password: 'wrongpassword'
        });
        
      expect(res.statusCode).toEqual(401);
    });
  });

  // --- User Tests ---
  describe('User API /api/user', () => {
    
    it('✅ GET /profile - ควรดึงข้อมูลโปรไฟล์ได้เมื่อมี Token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('name');
      expect(res.body.user.username).toBe('doctor_somchai');
    });

    it('❌ GET /profile - ควรคืนค่า 401 เมื่อไม่มี Token', async () => {
      const res = await request(app).get('/api/user/profile');
      expect(res.statusCode).toEqual(401);
    });

    it('✅ GET /account/:username - ควรดึงข้อมูลผู้ใช้ได้จากชื่อบัญชี', async () => {
      const res = await request(app).get('/api/user/account/nurse_somsri');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.user.username).toBe('nurse_somsri');
      expect(res.body.user.role).toBe('NURSE');
    });

    it('❌ GET /account/:username - ควรคืนค่า 404 เมื่อไม่พบผู้ใช้', async () => {
      const res = await request(app).get('/api/user/account/non_existent_user');
      expect(res.statusCode).toEqual(404);
    });
  });

});
