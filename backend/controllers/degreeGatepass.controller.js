const { PutObjectCommand } = require("@aws-sdk/client-s3");

const supabase = require("../config/supabase");
const s3 = require("../config/s3");

const BUCKET_NAME = "leave-letter";

const createAuditLog = require("../utils/auditLogger");
const expireGatepasses = require("../jobs/expireGatepass");

const createDegreeGatepass = async (req, res) => {
    try {
        const {
            student_id,
            teacher_id,
            reason,
        } = req.body;

        const file = req.file;

        await expireGatepasses();

        const now = new Date();

        const indiaDate = new Intl.DateTimeFormat("en-CA", {
             timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(now);

        const expiresAt = new Date(`${indiaDate}T16:00:00+05:30`);

        if (!student_id || !teacher_id || !reason) {
            return res.status(400).json({
                success: false,
                message: "student_id, teacher_id, and reason are required.",
            });
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Signed leave letter is required.",
            });
        }

        // Check if student already has an active gatepass
        const { data: existingActive } = await supabase
            .from("degree_gatepasses")
            .select("id")
            .eq("student_id", student_id)
            .eq("status", "ACTIVE")
            .limit(1)
            .maybeSingle();

        if (existingActive) {
            return res.status(409).json({
                success: false,
                message: "Student already has an active gate pass. Each student can have only one active gate pass at a time.",
            });
        }

        // Check Degree student
        const { data: student, error: studentError } = await supabase
            .from("degree_students")
            .select("id, name, registration_number, course, year, section")
            .eq("id", student_id)
            .single();

        if (studentError || !student) {
            return res.status(404).json({
                success: false,
                message: "Degree student not found.",
            });
        }

        // Check teacher
        const { data: teacher, error: teacherError } = await supabase
            .from("teachers")
            .select("id, name, department, teaching_level")
            .eq("id", teacher_id)
            .single();

        if (teacherError || !teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found.",
            });
        }

        // Only teaching level matters
        if (teacher.teaching_level !== "DEGREE") {
            return res.status(400).json({
                success: false,
                message: "Selected teacher is not a degree teacher.",
            });
        }

        // File path in Supabase Storage
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
        const filePath = `degree/${student_id}/${fileName}`;

        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filePath,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await s3.send(uploadCommand);

        const signedLetterUrl =
            `${process.env.SUPABASE_S3_ENDPOINT}/${BUCKET_NAME}/${filePath}`;

        // Create gatepass
        const { data: gatepass, error: gatepassError } = await supabase
            .from("degree_gatepasses")
            .insert({
                student_id,
                teacher_id,
                reason,
                signed_letter_url: signedLetterUrl,
                status: "ACTIVE",
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (gatepassError) {
            console.error(gatepassError);

            return res.status(500).json({
                success: false,
                message: "Failed to create degree gatepass.",
            });
        }

        await createAuditLog({
            actor_type: "RECEPTION",
            action: "CREATE_GATEPASS",
            entity_type: "DEGREE_GATEPASS",
            entity_id: gatepass.id,
            description: `Degree gatepass created for ${student.name}.`
        });

        const { error: eventError } = await supabase.from("degree_gatepass_events").insert({
            gatepass_id: gatepass.id,
            event_type: "CREATED",
            event_time: gatepass.created_at || new Date().toISOString(),
            notes: "Degree gatepass created."
        });
        if (eventError) console.error("Create degree gatepass event error:", eventError);

        return res.status(201).json({
            success: true,
            message: "Degree gatepass created successfully.",
            gatepass,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


const searchDegreeGatepasses = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Student name is required.",
            });
        }

        const { data: students, error: studentError } = await supabase
            .from("degree_students")
            .select(`
                id,
                name,
                registration_number,
                course,
                year,
                section
            `)
            .ilike("name", `%${name}%`);

        if (studentError) {
            console.error(studentError);

            return res.status(500).json({
                success: false,
                message: "Failed to search students.",
            });
        }

        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No degree student found.",
            });
        }

        const studentIds = students.map(student => student.id);

        const { data: gatepasses, error: gatepassError } = await supabase
            .from("degree_gatepasses")
            .select("*")
            .in("student_id", studentIds)
            .order("created_at", {
                ascending: false,
            });

        if (gatepassError) {
            console.error(gatepassError);

            return res.status(500).json({
                success: false,
                message: "Failed to search gatepasses.",
            });
        }

        const result = gatepasses.map(gatepass => ({
            ...gatepass,
            student: students.find(
                student => student.id === gatepass.student_id
            ),
        }));

        return res.status(200).json({
            success: true,
            count: result.length,
            gatepasses: result,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


const markDegreeGatepassExited = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: gatepass, error: findError } = await supabase
            .from("degree_gatepasses")
            .select("*")
            .eq("id", id)
            .single();

        if (findError || !gatepass) {
            return res.status(404).json({
                success: false,
                message: "Gatepass not found.",
            });
        }

        if (gatepass.status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: `Cannot exit a gatepass with status ${gatepass.status}.`,
            });
        }

        const exitTime = new Date().toISOString();

        const { data: updatedGatepass, error: updateError } = await supabase
            .from("degree_gatepasses")
            .update({
                status: "EXITED",
                exit_time: exitTime,
            })
            .eq("id", id)
            .select()
            .single();

        if (updateError) {
            console.error(updateError);

            return res.status(500).json({
                success: false,
                message: "Failed to mark gatepass as exited.",
            });
        }

        await createAuditLog({
            actor_type: "SECURITY",
            action: "EXIT_DEGREE_GATEPASS",
            entity_type: "DEGREE_GATEPASS",
            entity_id: gatepass.id,
            description: `Degree student ${gatepass.student_id} exited using gatepass.`
        });

        // Create event
        const { error: eventError } = await supabase
            .from("degree_gatepass_events")
            .insert({
                gatepass_id: id,
                event_type: "EXITED",
                event_time: exitTime,
                notes: "Student exited through security gate.",
            });

        if (eventError) {
            console.error(eventError);
        }

        return res.status(200).json({
            success: true,
            message: "Degree student marked as exited.",
            gatepass: updatedGatepass,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const getDegreeStudentForGatepass = async (req, res) => {
    try {
        const { registration_number } = req.params;

        if (!registration_number) {
            return res.status(400).json({
                error: "Registration number is required."
            });
        }

        const { data: student, error } = await supabase
            .from("degree_students")
            .select(`
                id,
                name,
                registration_number,
                course
            `)
            .eq("registration_number", registration_number)
            .single();

        if (error || !student) {
            return res.status(404).json({
                error: "Degree student not found."
            });
        }

        return res.status(200).json({
            student
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error."
        });
    }
};

module.exports = {
    createDegreeGatepass,
    searchDegreeGatepasses,
    markDegreeGatepassExited,
    getDegreeStudentForGatepass
};