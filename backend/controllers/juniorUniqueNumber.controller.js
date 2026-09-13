const supabase = require("../config/supabase");
const createAuditLog = require("../utils/auditLogger");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STUDENT_FIELDS = "id, name, registration_number, department, board, class_name, section";
const UNIQUE_NUMBER_FIELDS = "id, student_id, unique_number, assigned_at, is_active";

const isValidUuid = (value) =>
    typeof value === "string" && UUID_PATTERN.test(value);

const parsePositiveInteger = (value) => {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        return value;
    }

    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const parsed = Number(value.trim());
        return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
    }

    return null;
};

const isUniqueConflict = (error) => error && error.code === "23505";

const getStudentById = async (studentId) => {
    if (!isValidUuid(studentId)) {
        return { invalid: true };
    }

    const { data, error } = await supabase
        .from("junior_students")
        .select(STUDENT_FIELDS)
        .eq("id", studentId)
        .maybeSingle();

    return { data, error };
};

const getStudentByRegistrationNumber = async (registrationNumber) => {
    const { data, error } = await supabase
        .from("junior_students")
        .select(STUDENT_FIELDS)
        .eq("registration_number", registrationNumber)
        .maybeSingle();

    return { data, error };
};

const getAssignmentForStudent = async (studentId) => {
    const { data, error } = await supabase
        .from("junior_unique_numbers")
        .select(UNIQUE_NUMBER_FIELDS)
        .eq("student_id", studentId)
        .maybeSingle();

    return { data, error };
};

const getStudentForAssignment = async (assignment) => {
    const { data, error } = await supabase
        .from("junior_students")
        .select(STUDENT_FIELDS)
        .eq("id", assignment.student_id)
        .maybeSingle();

    return { data, error };
};

const assignJuniorUniqueNumber = async (req, res) => {
    try {
        const registrationNumber = req.body && req.body.registration_number;

        if (typeof registrationNumber !== "string" || !registrationNumber.trim()) {
            return res.status(400).json({
                error: "Registration number is required."
            });
        }

        const { data: student, error: studentError } =
            await getStudentByRegistrationNumber(registrationNumber.trim());

        if (studentError) {
            console.error("Find junior student error:", studentError);
            return res.status(500).json({ error: "Failed to find junior student." });
        }

        if (!student) {
            return res.status(404).json({ error: "Junior student not found." });
        }

        const { data: existingAssignment, error: assignmentError } =
            await getAssignmentForStudent(student.id);

        if (assignmentError) {
            console.error("Find unique number error:", assignmentError);
            return res.status(500).json({ error: "Failed to check unique number assignment." });
        }

        if (existingAssignment) {
            if (existingAssignment.is_active) {
                return res.status(200).json({
                    message: "Unique number already assigned.",
                    uniqueNumber: existingAssignment.unique_number,
                    student
                });
            }

            return res.status(409).json({
                error: "A unique number is already assigned to this student."
            });
        }

        const { data: existingNumbers, error: numbersError } = await supabase
            .from("junior_unique_numbers")
            .select("unique_number")
            .order("unique_number", { ascending: true });

        if (numbersError) {
            console.error("List unique numbers error:", numbersError);
            return res.status(500).json({ error: "Failed to generate unique number." });
        }

        const occupiedNumbers = new Set(
            (existingNumbers || []).map((record) => record.unique_number)
        );

        let generatedNumber = 1;
        while (occupiedNumbers.has(generatedNumber)) {
            generatedNumber += 1;
        }

        const { data: uniqueNumber, error: insertError } = await supabase
            .from("junior_unique_numbers")
            .insert({
                student_id: student.id,
                unique_number: generatedNumber,
                is_active: true
            })
            .select(UNIQUE_NUMBER_FIELDS)
            .single();

        if (insertError) {
            if (isUniqueConflict(insertError)) {
                return res.status(409).json({
                    error: "Unique number assignment conflict. Please try again."
                });
            }

            console.error("Assign unique number error:", insertError);
            return res.status(500).json({ error: "Failed to assign unique number." });
        }

        await createAuditLog({
            actor_type: "SYSTEM",
            action: "ASSIGN_UNIQUE_NUMBER",
            entity_type: "JUNIOR_UNIQUE_NUMBER",
            entity_id: uniqueNumber.id,
            description: `Unique number ${uniqueNumber.unique_number} assigned to junior student ${student.name}.`
        });

        return res.status(201).json({
            message: "Unique number assigned successfully.",
            uniqueNumber,
            student
        });
    } catch (error) {
        console.error("Assign unique number server error:", error);
        return res.status(500).json({ error: "Failed to assign unique number." });
    }
};

const getUniqueNumberByNumber = async (req, res) => {
    try {
        const uniqueNumberValue = parsePositiveInteger(req.params.uniqueNumber);

        if (!uniqueNumberValue) {
            return res.status(400).json({ error: "A positive integer unique number is required." });
        }

        const { data: uniqueNumber, error } = await supabase
            .from("junior_unique_numbers")
            .select(UNIQUE_NUMBER_FIELDS)
            .eq("unique_number", uniqueNumberValue)
            .eq("is_active", true)
            .maybeSingle();

        if (error) {
            console.error("Find unique number error:", error);
            return res.status(500).json({ error: "Failed to find unique number." });
        }

        if (!uniqueNumber) {
            return res.status(404).json({ error: "Active unique number not found." });
        }

        const { data: student, error: studentError } =
            await getStudentForAssignment(uniqueNumber);

        if (studentError) {
            console.error("Find student for unique number error:", studentError);
            return res.status(500).json({ error: "Failed to find junior student." });
        }

        if (!student) {
            return res.status(404).json({ error: "Junior student not found." });
        }

        const { data: activeGatepass, error: gatepassError } = await supabase
            .from("junior_gatepasses")
            .select("id, student_id, teacher_id, reason, signed_letter_url, status, created_at, exit_time, expires_at")
            .eq("student_id", student.id)
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (gatepassError) {
            console.error("Find active junior gatepass error:", gatepassError);
            return res.status(500).json({ error: "Failed to find active gatepass." });
        }

        return res.status(200).json({ uniqueNumber, student, gatepass: activeGatepass || null });
    } catch (error) {
        console.error("Find unique number server error:", error);
        return res.status(500).json({ error: "Failed to find unique number." });
    }
};

const getUniqueNumberByRegistrationNumber = async (req, res) => {
    try {
        const registrationNumber = req.params.registrationNumber;

        if (typeof registrationNumber !== "string" || !registrationNumber.trim()) {
            return res.status(400).json({ error: "Registration number is required." });
        }

        const { data: student, error: studentError } =
            await getStudentByRegistrationNumber(registrationNumber.trim());

        if (studentError) {
            console.error("Find junior student error:", studentError);
            return res.status(500).json({ error: "Failed to find junior student." });
        }

        if (!student) {
            return res.status(404).json({ error: "Junior student not found." });
        }

        const { data: uniqueNumber, error } = await getAssignmentForStudent(student.id);

        if (error) {
            console.error("Find student unique number error:", error);
            return res.status(500).json({ error: "Failed to find unique number." });
        }

        if (!uniqueNumber || !uniqueNumber.is_active) {
            return res.status(404).json({ error: "Unique number not assigned to this student." });
        }

        return res.status(200).json({ uniqueNumber, student });
    } catch (error) {
        console.error("Find student unique number server error:", error);
        return res.status(500).json({ error: "Failed to find unique number." });
    }
};

const getAllUniqueNumbers = async (req, res) => {
    try {
        const { data: assignments, error } = await supabase
            .from("junior_unique_numbers")
            .select(UNIQUE_NUMBER_FIELDS)
            .eq("is_active", true)
            .order("unique_number", { ascending: true });

        if (error) {
            console.error("List unique numbers error:", error);
            return res.status(500).json({ error: "Failed to fetch unique numbers." });
        }

        const uniqueNumbers = await Promise.all(
            (assignments || []).map(async (assignment) => {
                const { data: student } = await getStudentForAssignment(assignment);
                return { ...assignment, student: student || undefined };
            })
        );

        return res.status(200).json({
            count: uniqueNumbers.length,
            uniqueNumbers
        });
    } catch (error) {
        console.error("List unique numbers server error:", error);
        return res.status(500).json({ error: "Failed to fetch unique numbers." });
    }
};

module.exports = {
    assignJuniorUniqueNumber,
    getUniqueNumberByNumber,
    getUniqueNumberByRegistrationNumber,
    getAllUniqueNumbers
};
