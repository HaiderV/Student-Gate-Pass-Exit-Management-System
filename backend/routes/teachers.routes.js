const express = require('express');

const {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
} = require('../controllers/teachers.controller');

const router = express.Router();


// GET /api/teachers
router.get('/', getTeachers);


// GET /api/teachers/:id
router.get('/:id', getTeacherById);


// POST /api/teachers
router.post('/', createTeacher);

router.put('/:id', updateTeacher);

router.delete('/:id', deleteTeacher);


module.exports = router;