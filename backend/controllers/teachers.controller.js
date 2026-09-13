const supabase = require('../config/supabase');
const createAuditLog = require('../utils/auditLogger');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_LEVELS = ['JUNIOR', 'DEGREE'];

const isValidId = id => typeof id === 'string' && UUID_PATTERN.test(id);

const getTeacherFields = body => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body is required.' };
    }

    if (typeof body.name !== 'string' || !body.name.trim()) {
        return { error: 'Name is required.' };
    }

    if (typeof body.teaching_level !== 'string' || !VALID_LEVELS.includes(body.teaching_level.trim().toUpperCase())) {
        return { error: 'Teaching level must be JUNIOR or DEGREE.' };
    }

    return {
        teacher: {
            name: body.name.trim(),
            department: typeof body.department === 'string' && body.department.trim()
                ? body.department.trim()
                : null,
            teaching_level: body.teaching_level.trim().toUpperCase()
        }
    };
};


// GET all teachers
const getTeachers = async (req, res) => {
    try {
        const { level } = req.query;

        let query = supabase
            .from('teachers')
            .select('*')
            .order('name', { ascending: true });

        // Filter by teaching level
        if (level) {
            query = query.in('teaching_level', [level, 'BOTH']);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Get teachers error:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch teachers',
                error: error.message
            });
        }

        res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });

    } catch (error) {
        console.error('Server error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


// GET teacher by ID
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Server error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


// CREATE teacher
const createTeacher = async (req, res) => {
    try {
        const { teacher, error: validationError } = getTeacherFields(req.body);

        if (validationError) return res.status(400).json({ error: validationError });

        const { data, error } = await supabase
            .from('teachers')
            .insert([teacher])
            .select()
            .single();

        if (error) {
            console.error('Create teacher error:', error);

            return res.status(500).json({ error: 'Failed to create teacher.' });
        }

        await createAuditLog({
            actor_type: 'ADMIN',
            action: 'CREATE_TEACHER',
            entity_type: 'TEACHER',
            entity_id: data.id,
            description: `Teacher "${data.name}" was created`
        });

        res.status(201).json({
            message: 'Teacher created successfully.',
            teacher: data
        });

    } catch (error) {
        console.error('Server error:', error);

        res.status(500).json({
            error: 'Failed to create teacher.'
        });
    }
};

const updateTeacher = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ error: 'A valid teacher ID is required.' });
        const { teacher, error: validationError } = getTeacherFields(req.body);
        if (validationError) return res.status(400).json({ error: validationError });

        const { data, error } = await supabase.from('teachers')
            .update(teacher).eq('id', req.params.id).select().maybeSingle();
        if (error) {
            console.error('Update teacher error:', error);
            return res.status(500).json({ error: 'Failed to update teacher.' });
        }
        if (!data) return res.status(404).json({ error: 'Teacher not found.' });

        await createAuditLog({ actor_type: 'ADMIN', action: 'UPDATE_TEACHER', entity_type: 'TEACHER', entity_id: data.id, description: `Teacher "${data.name}" was updated` });
        return res.status(200).json({ message: 'Teacher updated successfully.', teacher: data });
    } catch (error) {
        console.error('Update teacher server error:', error);
        return res.status(500).json({ error: 'Failed to update teacher.' });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ error: 'A valid teacher ID is required.' });
        const { data, error } = await supabase.from('teachers').delete().eq('id', req.params.id).select('id, name').maybeSingle();
        if (error) {
            if (error.code === '23503') return res.status(409).json({ error: 'Cannot delete this teacher because related gatepasses exist.' });
            console.error('Delete teacher error:', error);
            return res.status(500).json({ error: 'Failed to delete teacher.' });
        }
        if (!data) return res.status(404).json({ error: 'Teacher not found.' });
        await createAuditLog({ actor_type: 'ADMIN', action: 'DELETE_TEACHER', entity_type: 'TEACHER', entity_id: data.id, description: `Teacher "${data.name}" was deleted` });
        return res.status(200).json({ message: 'Teacher deleted successfully.' });
    } catch (error) {
        console.error('Delete teacher server error:', error);
        return res.status(500).json({ error: 'Failed to delete teacher.' });
    }
};


module.exports = {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher
};