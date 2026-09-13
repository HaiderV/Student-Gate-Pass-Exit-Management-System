const supabase = require("../config/supabase");
const createAuditLog = require("../utils/auditLogger");

const recordDegreeExit = async (req, res) => {
    try {
        const registrationNumber = req.body && req.body.registration_number;
        if (typeof registrationNumber !== "string" || !registrationNumber.trim()) {
            return res.status(400).json({ error: "Registration number is required." });
        }

        const { data: student, error: studentError } = await supabase
            .from("degree_students")
            .select("id, name, registration_number, course, year, section")
            .eq("registration_number", registrationNumber.trim())
            .maybeSingle();
        if (studentError) {
            console.error("Find degree student exit error:", studentError);
            return res.status(500).json({ error: "Failed to find degree student." });
        }
        if (!student) return res.status(404).json({ error: "Degree student not found." });

        const { data: gatepass, error: gatepassError } = await supabase
            .from("degree_gatepasses")
            .select("id, student_id, teacher_id, reason, signed_letter_url, status, created_at, exit_time, expires_at")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (gatepassError) {
            console.error("Find degree gatepass exit error:", gatepassError);
            return res.status(500).json({ error: "Failed to find degree gatepass." });
        }
        if (!gatepass) return res.status(404).json({ error: "No active gatepass found for this student." });
        if (gatepass.status === "EXITED" || gatepass.exit_time) return res.status(409).json({ error: "This student has already exited." });
        if (gatepass.status === "CANCELLED") return res.status(409).json({ error: "This gatepass is cancelled." });
        if (gatepass.status !== "ACTIVE") return res.status(409).json({ error: `Cannot exit a gatepass with status ${gatepass.status}.` });

        const exitTime = new Date().toISOString();
        const { data: updatedGatepass, error: updateError } = await supabase
            .from("degree_gatepasses")
            .update({ status: "EXITED", exit_time: exitTime })
            .eq("id", gatepass.id)
            .select()
            .single();
        if (updateError) {
            console.error("Update degree gatepass exit error:", updateError);
            return res.status(500).json({ error: "Failed to mark degree gatepass as exited." });
        }

        const { data: event, error: eventError } = await supabase.from("degree_gatepass_events")
            .insert({ gatepass_id: gatepass.id, event_type: "EXITED", event_time: exitTime, notes: "Student exited through security gate." })
            .select().single();
        if (eventError) console.error("Create degree gatepass event error:", eventError);

        await createAuditLog({
            actor_type: "SECURITY",
            action: "DEGREE_EXIT",
            entity_type: "DEGREE_GATEPASS",
            entity_id: gatepass.id,
            description: `Degree student ${student.name} marked EXITED using registration number ${student.registration_number}.`
        });

        return res.status(200).json({ message: "Degree student marked as exited.", student, gatepass: updatedGatepass, event });
    } catch (error) {
        console.error("Degree exit server error:", error);
        return res.status(500).json({ error: "Failed to record degree exit." });
    }
};

module.exports = { recordDegreeExit };
