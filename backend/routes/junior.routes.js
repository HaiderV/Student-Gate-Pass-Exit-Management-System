const express = require('express');

const {
    getJuniorStudents,
    getJuniorStudentById,
    searchJuniorStudent,
    createJuniorStudent,
    updateJuniorStudent,
    deleteJuniorStudent
} = require('../controllers/junior.controller');

const {
    assignJuniorUniqueNumber,
    getUniqueNumberByNumber,
    getUniqueNumberByRegistrationNumber,
    getAllUniqueNumbers
} = require('../controllers/juniorUniqueNumber.controller');

const router = express.Router();


// ==========================================
// STUDENT ROUTES
// ==========================================

// GET /api/junior/students
router.get('/students', getJuniorStudents);

// GET /api/junior/students/search?registration_number=...
router.get('/students/search', searchJuniorStudent);

// GET /api/junior/students/:id
router.get('/students/:id', getJuniorStudentById);

// POST /api/junior/students
router.post('/students', createJuniorStudent);

// PUT /api/junior/students/:id
router.put('/students/:id', updateJuniorStudent);

// DELETE /api/junior/students/:id
router.delete('/students/:id', deleteJuniorStudent);

// GET /api/junior/unique-numbers
router.get('/unique-numbers', getAllUniqueNumbers);

// POST /api/junior/unique-number
router.post('/unique-number', assignJuniorUniqueNumber);

// GET /api/junior/unique-number/:uniqueNumber
router.get('/unique-number/:uniqueNumber', getUniqueNumberByNumber);

// GET /api/junior/students/registration/:registrationNumber/unique-number
router.get(
    '/students/registration/:registrationNumber/unique-number',
    getUniqueNumberByRegistrationNumber
);


module.exports = router;