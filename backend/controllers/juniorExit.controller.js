const supabase = require("../config/supabase");
const createAuditLog = require("../utils/auditLogger");

const parsePositiveInteger = value => {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const parsed = Number(value.trim());
        return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
    }
    return null;
};

const findStudentAndUniqueNumber = async ({ uniqueNumber, registrationNumber }) => {
    let student;
    let uniqueRecord;

    if (uniqueNumber !== undefined) {
        const parsedNumber = parsePositiveInteger(uniqueNumber);
        if (!parsedNumber) return { validationError: "A positive integer unique number is required." };

        const result = await supabase.from("junior_unique_numbers")
            .select("id, student_id, unique_number, assigned_at, is_active")
            .eq("unique_number", parsedNumber).maybeSingle();
        if (result.error) return { error: result.error };
        if (!result.data || !result.data.is_active) return { notFound: "Active unique number not found." };
        uniqueRecord = result.data;

        const studentResult = await supabase.from("junior_students")
            .select("id, name, registration_number, department, board, class_name, section")
            .eq("id", uniqueRecord.student_id).maybeSingle();
        if (studentResult.error) return { error: studentResult.error };
        student = studentResult.data;
    } else {
        const normalizedRegistration = typeof registrationNumber === "string" ? registrationNumber.trim() : "";
        if (!normalizedRegistration) return { validationError: "Registration number is required." };

        const studentResult = await supabase.from("junior_students")
            .select("id, name, registration_number, department, board, class_name, section")
            .eq("registration_number", normalizedRegistration).maybeSingle();
        if (studentResult.error) return { error: studentResult.error };
        student = studentResult.data;
        if (!student) return { notFound: "Junior student not found." };

        const numberResult = await supabase.from("junior_unique_numbers")
            .select("id, student_id, unique_number, assigned_at, is_active")
            .eq("student_id", student.id).maybeSingle();
        if (numberResult.error) return { error: numberResult.error };
        if (!numberResult.data || !numberResult.data.is_active) return { notFound: "Active unique number not found." };
        uniqueRecord = numberResult.data;
    }

    if (!student) return { notFound: "Junior student not found." };
    return { student, uniqueRecord };
};

const recordExit = async (req, res, lookup) => {
    try {
        const isUniqueNumberExit = lookup.uniqueNumber !== undefined;
        const found = await findStudentAndUniqueNumber(lookup);
        if (found.validationError) return res.status(400).json({ error: found.validationError });
        if (found.notFound) return res.status(404).json({ error: found.notFound });
        if (found.error) {
            console.error("Find junior exit subject error:", found.error);
            return res.status(500).json({ error: "Failed to find junior exit subject." });
        }

        const { student, uniqueRecord } = found;

        // Check if student has already exited via exit logs
        if (uniqueRecord && uniqueRecord.id) {
            const { data: existingExit } = await supabase.from("junior_exit_logs")
                .select("id").eq("unique_number_id", uniqueRecord.id).limit(1).maybeSingle();
            if (existingExit) return res.status(409).json({ error: "This student has already exited." });
        }

        // Look for active gatepass
        const { data: gatepass, error: gatepassError } = await supabase
            .from("junior_gatepasses")
            .select("id, student_id, teacher_id, reason, signed_letter_url, status, created_at, exit_time, expires_at")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (gatepassError) {
            console.error("Find junior gatepass error:", gatepassError);
            return res.status(500).json({ error: "Failed to find junior gatepass." });
        }

        // For early exit by registration number, an active gatepass is mandatory!
        if (!isUniqueNumberExit) {
            if (!gatepass) {
                return res.status(404).json({ error: "No gatepass found for this student. Early exit requires an approved gate pass." });
            }
            if (gatepass.status === "EXITED" || gatepass.exit_time) {
                return res.status(409).json({ error: "This student has already exited." });
            }
            if (gatepass.status === "CANCELLED") {
                return res.status(409).json({ error: "This gatepass is cancelled." });
            }
            if (gatepass.status === "EXPIRED") {
                return res.status(409).json({ error: "This gatepass has expired." });
            }
            if (gatepass.status !== "ACTIVE") {
                return res.status(409).json({ error: `Cannot exit a gatepass with status ${gatepass.status}.` });
            }
        }

        const exitTime = new Date().toISOString();
        let updatedGatepass = null;
        let event = null;

        // If gatepass exists and is ACTIVE, mark it EXITED
        if (gatepass && gatepass.status === "ACTIVE") {
            const { data: updated, error: updateError } = await supabase
                .from("junior_gatepasses")
                .update({ status: "EXITED", exit_time: exitTime })
                .eq("id", gatepass.id).select().single();
            if (!updateError && updated) {
                updatedGatepass = updated;
                const { data: ev, error: evError } = await supabase.from("junior_gatepass_events")
                    .insert({ gatepass_id: gatepass.id, event_type: "EXITED", event_time: exitTime, notes: "Student exited through security gate." })
                    .select().single();
                if (!evError) event = ev;
            }
        }

        // Record in junior_exit_logs if uniqueRecord is present
        let exitLog = null;
        if (uniqueRecord && uniqueRecord.id) {
            const { data: log, error: exitLogError } = await supabase.from("junior_exit_logs")
                .insert({ student_id: student.id, unique_number_id: uniqueRecord.id, exit_time: exitTime })
                .select().single();
            if (exitLogError) {
                console.error("Create junior exit log error:", exitLogError);
                // If it's unique number exit and log fails, return error
                if (isUniqueNumberExit) {
                    return res.status(500).json({ error: "Failed to record student exit." });
                }
            } else {
                exitLog = log;
            }
        }

        await createAuditLog({
            actor_type: "SECURITY",
            action: "JUNIOR_EXIT",
            entity_type: isUniqueNumberExit ? "JUNIOR_EXIT_LOG" : "JUNIOR_GATEPASS",
            entity_id: exitLog ? exitLog.id : (updatedGatepass ? updatedGatepass.id : student.id),
            description: `Junior student ${student.name} marked EXITED${uniqueRecord ? ` using unique number ${uniqueRecord.unique_number}` : ''}.`
        });

        return res.status(200).json({
            message: "Junior student marked as exited.",
            student,
            uniqueNumber: uniqueRecord,
            gatepass: updatedGatepass,
            event,
            exit: exitLog
        });
    } catch (error) {
        console.error("Junior exit server error:", error);
        return res.status(500).json({ error: "Failed to record junior exit." });
    }
};

const recordJuniorExit = (req, res) => recordExit(req, res, {
    uniqueNumber: req.body && req.body.unique_number
});

const recordJuniorExitByRegistration = (req, res) => recordExit(req, res, {
    registrationNumber: req.body && req.body.registration_number
});

module.exports = {
    recordJuniorExit,
    recordJuniorExitByRegistration
};
