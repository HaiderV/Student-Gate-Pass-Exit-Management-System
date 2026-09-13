const express = require('express');

const {
    getDegreeStudents,
    getDegreeStudentById,
    searchDegreeStudent,
    createDegreeStudent,
    updateDegreeStudent,
    deleteDegreeStudent
} = require('../controllers/degree.controller');

const router = express.Router();


// ==========================================
// STUDENT ROUTES
// ==========================================

// GET /api/degree/students
router.get('/students', getDegreeStudents);

// GET /api/degree/students/search?registration_number=...
router.get('/students/search', searchDegreeStudent);

// GET /api/degree/students/:id
router.get('/students/:id', getDegreeStudentById);

// POST /api/degree/students
router.post('/students', createDegreeStudent);

// PUT /api/degree/students/:id
router.put('/students/:id', updateDegreeStudent);

// DELETE /api/degree/students/:id
router.delete('/students/:id', deleteDegreeStudent);


module.exports = router;