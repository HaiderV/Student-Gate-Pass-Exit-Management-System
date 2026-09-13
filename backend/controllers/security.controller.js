const supabase = require("../config/supabase");
// Verify junior's unique number
const verifyJuniorUniqueNumber = async (req, res) => {
    try {
        const { unique_number } = req.query;

        if (unique_number === undefined) {
            return res.status(400).json({
                success: false,
                message: "Unique number is required.",
            });
        }

        const { data: record, error } = await supabase
            .from("junior_unique_numbers")
            .select(`
                id,
                student_id,
                unique_number,
                assigned_at,
                is_active
            `)
            .eq("unique_number", unique_number)
            .eq("is_active", true)
            .single();

        if (error || !record) {
            return res.status(404).json({
                success: false,
                message: "Invalid or inactive unique number.",
            });
        }

        // Get student details
        const { data: student, error: studentError } = await supabase
            .from("junior_students")
            .select(`
                id,
                name,
                registration_number,
                department,
                board,
                class_name,
                section
            `)
            .eq("id", record.student_id)
            .single();

        if (studentError || !student) {
            return res.status(404).json({
                success: false,
                message: "Student associated with this number was not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Unique number verified successfully.",
            student,
            unique_number: record.unique_number,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


module.exports = {
    verifyJuniorUniqueNumber,
};