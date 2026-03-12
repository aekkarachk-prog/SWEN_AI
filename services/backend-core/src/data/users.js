// services/backend-core/src/data/users.js

const MOCK_USERS = [
  {
    id: 1,
    username: 'doctor_somchai',
    password: 'password123',
    name: 'นพ. สมชาย ใจดี',
    role: 'DOCTOR',
    email: 'somchai@mdkku.com'
  },
  {
    id: 2,
    username: 'nurse_somsri',
    password: 'password123',
    name: 'พว. สมศรี มีสุข',
    role: 'NURSE',
    email: 'somsri@mdkku.com'
  },
  {
    id: 3,
    username: 'doctor',
    password: '123',
    name: 'นพ. ทดสอบ ระบบ',
    role: 'DOCTOR',
    email: 'test_doctor@mdkku.com'
  },
  {
    id: 4,
    username: 'nurse',
    password: '123',
    name: 'พว. ทดสอบ ระบบ',
    role: 'NURSE',
    email: 'test_nurse@mdkku.com'
  },
  {
    id: 5,
    username: 'boss',
    password: '123',
    name: 'พว. ทดสอบ ระบบ',
    role: 'DOCTOR',
    email: 'test_boss@mdkku.com'
  }
];

module.exports = MOCK_USERS;
