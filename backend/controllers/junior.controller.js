const supabase = require('../config/supabase');
const createAuditLog = require('../utils/auditLogger');

const STUDENT_FIELDS = [
    'name',
    'registration_number',
    'department',
    'board',
    'class_name',
    'section'
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getStudentFields = (body) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body is required.' };
    }

    const student = {};

    for (const field of STUDENT_FIELDS) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
            return { error: `${field} is required.` };
        }

        student[field] = body[field].trim();
    }

    return { student };
};

const isValidId = (id) => typeof id === 'string' && UUID_PATTERN.test(id);

const isDuplicateRegistrationError = (error) => error && error.code === '23505';

const isRelatedRecordError = (error) => error && error.code === '23503';


// ==========================================
// GET ALL JUNIOR STUDENTS
// ==========================================

const getJuniorStudents = async (req, res) => {
    try {

        const { data, error } = await supabase
            .from('junior_students')
            .select('id, name, registration_number, department, board, class_name, section, created_at')
            .order('name', { ascending: true });

        if (error) {
            console.error('Get junior students error:', error);

            return res.status(500).json({
                error: 'Failed to fetch junior students.'
            });
        }

        res.status(200).json({
            count: data.length,
            students: data
        });

    } catch (error) {

        console.error('Server error:', error);

        res.status(500).json({ error: 'Failed to fetch junior students.' });
    }
};


// ==========================================
// GET JUNIOR STUDENT BY ID
// ==========================================

const getJuniorStudentById = async (req, res) => {
    try {

        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                error: 'A valid student ID is required.'
            });
        }

        const { data, error } = await supabase
            .from('junior_students')
            .select('id, name, registration_number, department, board, class_name, section, created_at')
            .eq('id', id)
            .single();

        if (error) {

            return res.status(404).json({
                error: 'Junior student not found.'
            });
        }

        res.status(200).json({
            student: data
        });

    } catch (error) {

        console.error('Server error:', error);

        res.status(500).json({ error: 'Failed to fetch junior student.' });
    }
};


// ==========================================
// SEARCH JUNIOR STUDENT
// ==========================================

const searchJuniorStudent = async (req, res) => {
    try {
        const rawSearch = req.query.search ?? req.query.registration_number;
        const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';

        if (!search) {

            return res.status(400).json({
                success: false,
                error: 'Search value is required.'
            });
        }

        const { data, error } = await supabase
            .from('junior_students')
            .select('*')
            .or(`registration_number.ilike.%${search}%,name.ilike.%${search}%,department.ilike.%${search}%,board.ilike.%${search}%,class_name.ilike.%${search}%,section.ilike.%${search}%`)
            .order('name', { ascending: true });

        if (error || !data || data.length === 0) {

            return res.status(404).json({
                error: 'Junior student not found.'
            });
        }

        res.status(200).json({
            count: data.length,
            students: data
        });

    } catch (error) {

        console.error('Server error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


// ==========================================
// CREATE JUNIOR STUDENT
// ==========================================

const createJuniorStudent = async (req, res) => {
    try {

        const { student, error: validationError } = getStudentFields(req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }


        const { data, error } = await supabase
            .from('junior_students')
            .insert([
                {
                    ...student
                }
            ])
            .select('id, name, registration_number, department, board, class_name, section, created_at')
            .single();


        if (error) {

            console.error('Create junior student error:', error);

            if (isDuplicateRegistrationError(error)) {
                return res.status(409).json({
                    error: 'Registration number already exists.'
                });
            }

            return res.status(500).json({
                error: 'Failed to create junior student.'
            });
        }

        await createAuditLog({ actor_type: 'ADMIN', action: 'CREATE_STUDENT', entity_type: 'JUNIOR_STUDENT', entity_id: data.id, description: `Junior student "${data.name}" was created` });

        res.status(201).json({
            message: 'Junior student created successfully.',
            student: data
        });

    } catch (error) {

        console.error('Server error:', error);

        res.status(500).json({ error: 'Failed to create junior student.' });
    }
};

const updateJuniorStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                error: 'A valid student ID is required.'
            });
        }

        const { student, error: validationError } = getStudentFields(req.body);

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const { data, error } = await supabase
            .from('junior_students')
            .update(student)
            .eq('id', id)
            .select('id, name, registration_number, department, board, class_name, section, created_at')
            .maybeSingle();

        if (error) {
            if (isDuplicateRegistrationError(error)) {
                return res.status(409).json({
                    error: 'Registration number already exists.'
                });
            }

            console.error('Update junior student error:', error);
            return res.status(500).json({ error: 'Failed to update junior student.' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Junior student not found.' });
        }

        await createAuditLog({ actor_type: 'ADMIN', action: 'UPDATE_STUDENT', entity_type: 'JUNIOR_STUDENT', entity_id: data.id, description: `Junior student "${data.name}" was updated` });

        return res.status(200).json({
            message: 'Junior student updated successfully.',
            student: data
        });
    } catch (error) {
        console.error('Update junior student server error:', error);
        return res.status(500).json({ error: 'Failed to update junior student.' });
    }
};

const deleteJuniorStudent = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                error: 'A valid student ID is required.'
            });
        }

        const { data, error } = await supabase
            .from('junior_students')
            .delete()
            .eq('id', id)
            .select('id')
            .maybeSingle();

        if (error) {
            if (isRelatedRecordError(error)) {
                return res.status(409).json({
                    error: 'Cannot delete this student because related records exist.'
                });
            }

            console.error('Delete junior student error:', error);
            return res.status(500).json({ error: 'Failed to delete junior student.' });
        }

        if (!data) {
            return res.status(404).json({ error: 'Junior student not found.' });
        }

        await createAuditLog({ actor_type: 'ADMIN', action: 'DELETE_STUDENT', entity_type: 'JUNIOR_STUDENT', entity_id: data.id, description: 'Junior student was deleted' });

        return res.status(200).json({
            message: 'Junior student deleted successfully.'
        });
    } catch (error) {
        if (isRelatedRecordError(error)) {
            return res.status(409).json({
                error: 'Cannot delete this student because related records exist.'
            });
        }

        console.error('Delete junior student server error:', error);
        return res.status(500).json({ error: 'Failed to delete junior student.' });
    }
};


module.exports = {
    getJuniorStudents,
    getJuniorStudentById,
    searchJuniorStudent,
    createJuniorStudent,
    updateJuniorStudent,
    deleteJuniorStudent
};