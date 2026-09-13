const supabase = require("../config/supabase");
const createAuditLog = require("../utils/auditLogger");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GATEPASS_FIELDS = "id, student_id, teacher_id, reason, signed_letter_url, status, created_at, exit_time, expires_at";
const TEACHER_FIELDS = "id, name, department, teaching_level";

const definitions = {
    degree: { table: "degree_gatepasses", eventTable: "degree_gatepass_events", studentTable: "degree_students", studentFields: "id, name, registration_number, course, year, section", studentType: "Degree", entityType: "DEGREE_GATEPASS" },
    junior: { table: "junior_gatepasses", eventTable: "junior_gatepass_events", studentTable: "junior_students", studentFields: "id, name, registration_number, department, board, class_name, section", studentType: "Junior", entityType: "JUNIOR_GATEPASS" }
};

const isValidId = value => typeof value === "string" && UUID_PATTERN.test(value);

const getRelatedData = async (definition, gatepass) => {
    const [{ data: student }, { data: teacher }] = await Promise.all([
        supabase.from(definition.studentTable).select(definition.studentFields).eq("id", gatepass.student_id).maybeSingle(),
        supabase.from("teachers").select(TEACHER_FIELDS).eq("id", gatepass.teacher_id).maybeSingle()
    ]);
    return { ...gatepass, student: student || null, teacher: teacher || null };
};

const expireGatepasses = require("../jobs/expireGatepass");

const getAllGatepasses = definition => async (req, res) => {
    try {
        await expireGatepasses();
        const { data, error } = await supabase.from(definition.table).select(GATEPASS_FIELDS).order("created_at", { ascending: false });
        if (error) {
            console.error("Get gatepasses error:", error);
            return res.status(500).json({ error: "Failed to fetch gatepasses." });
        }
        const gatepasses = await Promise.all((data || []).map(gatepass => getRelatedData(definition, gatepass)));
        return res.status(200).json({ count: gatepasses.length, gatepasses });
    } catch (error) {
        console.error("Get gatepasses server error:", error);
        return res.status(500).json({ error: "Failed to fetch gatepasses." });
    }
};

const getGatepassById = definition => async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ error: "A valid gatepass ID is required." });
        const { data, error } = await supabase.from(definition.table).select(GATEPASS_FIELDS).eq("id", req.params.id).maybeSingle();
        if (error) return res.status(500).json({ error: "Failed to fetch gatepass." });
        if (!data) return res.status(404).json({ error: "Gatepass not found." });
        return res.status(200).json({ gatepass: await getRelatedData(definition, data) });
    } catch (error) {
        console.error("Get gatepass server error:", error);
        return res.status(500).json({ error: "Failed to fetch gatepass." });
    }
};

const searchGatepasses = (definition, searchOverride) => async (req, res) => {
    try {
        await expireGatepasses();
        const rawSearch = searchOverride ?? req.query.search;
        const search = typeof rawSearch === "string" ? rawSearch.trim() : "";
        if (!search) return res.status(400).json({ error: "Search value is required." });
        const { data: students, error: studentError } = await supabase.from(definition.studentTable).select(definition.studentFields).or(`registration_number.ilike.%${search}%,name.ilike.%${search}%`);
        if (studentError) return res.status(500).json({ error: "Failed to search gatepasses." });
        let studentIds = (students || []).map(student => student.id);
        if (definition.studentType === "Junior" && /^\d+$/.test(search)) {
            const { data: numberRows, error: numberError } = await supabase.from("junior_unique_numbers").select("student_id").eq("unique_number", Number(search));
            if (numberError) return res.status(500).json({ error: "Failed to search gatepasses." });
            studentIds = [...new Set([...studentIds, ...(numberRows || []).map(row => row.student_id)])];
        }
        let query = supabase.from(definition.table).select(GATEPASS_FIELDS).order("created_at", { ascending: false });
        if (studentIds.length) query = query.in("student_id", studentIds);
        else if (isValidId(search)) query = query.eq("id", search);
        else if (["ACTIVE", "EXITED", "CANCELLED", "EXPIRED"].includes(search.toUpperCase())) query = query.eq("status", search.toUpperCase());
        else return res.status(404).json({ error: "No matching gatepasses found." });
        const { data: gatepasses, error } = await query;
        if (error) return res.status(500).json({ error: "Failed to search gatepasses." });
        const results = await Promise.all((gatepasses || []).map(gatepass => getRelatedData(definition, gatepass)));
        if (!results.length) return res.status(404).json({ error: "No matching gatepasses found." });
        return res.status(200).json({ count: results.length, gatepasses: results });
    } catch (error) {
        console.error("Search gatepass server error:", error);
        return res.status(500).json({ error: "Failed to search gatepasses." });
    }
};

const searchGatepassesByRegistration = definition => async (req, res) => {
    return searchGatepasses(definition, req.params.registrationNumber)(req, res);
};

const updateGatepass = definition => async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ error: "A valid gatepass ID is required." });
        const body = req.body || {};
        const updates = {};
        if (body.reason !== undefined) {
            if (typeof body.reason !== "string" || !body.reason.trim()) return res.status(400).json({ error: "Reason must not be empty." });
            updates.reason = body.reason.trim();
        }
        if (body.status !== undefined || body.exit_time !== undefined) return res.status(400).json({ error: "Status and exit_time are controlled by workflow endpoints." });
        if (body.expires_at !== undefined) updates.expires_at = body.expires_at;
        if (body.signed_letter_url !== undefined) updates.signed_letter_url = body.signed_letter_url;
        if (body.teacher_id !== undefined) updates.teacher_id = body.teacher_id;
        if (body.student_id !== undefined) updates.student_id = body.student_id;
        if (!Object.keys(updates).length) return res.status(400).json({ error: "At least one editable field is required." });
        const { data, error } = await supabase.from(definition.table).update(updates).eq("id", req.params.id).select(GATEPASS_FIELDS).maybeSingle();
        if (error) return res.status(500).json({ error: "Failed to update gatepass." });
        if (!data) return res.status(404).json({ error: "Gatepass not found." });
        await createAuditLog({ actor_type: "ADMIN", action: "UPDATE_GATEPASS", entity_type: definition.entityType, entity_id: data.id, description: `${definition.studentType} gatepass was updated` });
        return res.status(200).json({ message: "Gatepass updated successfully.", gatepass: await getRelatedData(definition, data) });
    } catch (error) {
        console.error("Update gatepass server error:", error);
        return res.status(500).json({ error: "Failed to update gatepass." });
    }
};

const deleteGatepass = definition => async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ error: "A valid gatepass ID is required." });
        const { data, error } = await supabase.from(definition.table).delete().eq("id", req.params.id).select("id").maybeSingle();
        if (error) {
            if (error.code === "23503") return res.status(409).json({ error: "Cannot delete this gatepass because related records exist." });
            return res.status(500).json({ error: "Failed to delete gatepass." });
        }
        if (!data) return res.status(404).json({ error: "Gatepass not found." });
        await createAuditLog({ actor_type: "ADMIN", action: "DELETE_GATEPASS", entity_type: definition.entityType, entity_id: data.id, description: `${definition.studentType} gatepass was deleted` });
        return res.status(200).json({ message: "Gatepass deleted successfully." });
    } catch (error) {
        console.error("Delete gatepass server error:", error);
        return res.status(500).json({ error: "Failed to delete gatepass." });
    }
};

const cancelGatepass = definition => async (req, res) => {
    try {
        if (!isValidId(req.params.id)) return res.status(400).json({ error: "A valid gatepass ID is required." });
        const { data: gatepass, error: findError } = await supabase.from(definition.table)
            .select(GATEPASS_FIELDS).eq("id", req.params.id).maybeSingle();
        if (findError) return res.status(500).json({ error: "Failed to find gatepass." });
        if (!gatepass) return res.status(404).json({ error: "Gatepass not found." });
        if (gatepass.status !== "ACTIVE") return res.status(400).json({ error: `Cannot cancel a gatepass with status ${gatepass.status}.` });

        const { data: updated, error: updateError } = await supabase.from(definition.table)
            .update({ status: "CANCELLED" }).eq("id", gatepass.id).select(GATEPASS_FIELDS).single();
        if (updateError) return res.status(500).json({ error: "Failed to cancel gatepass." });

        const { error: eventError } = await supabase.from(definition.eventTable).insert({
            gatepass_id: gatepass.id,
            event_type: "CANCELLED",
            event_time: new Date().toISOString(),
            notes: `${definition.studentType} gatepass cancelled.`
        });
        if (eventError) console.error("Create cancellation event error:", eventError);
        await createAuditLog({ actor_type: "SECURITY", action: "CANCEL_GATEPASS", entity_type: definition.entityType, entity_id: gatepass.id, description: `${definition.studentType} gatepass was cancelled.` });
        return res.status(200).json({ message: "Gatepass cancelled successfully.", gatepass: await getRelatedData(definition, updated) });
    } catch (error) {
        console.error("Cancel gatepass server error:", error);
        return res.status(500).json({ error: "Failed to cancel gatepass." });
    }
};

module.exports = {
    getDegreeGatepasses: getAllGatepasses(definitions.degree),
    getDegreeGatepassById: getGatepassById(definitions.degree),
    searchDegreeGatepassesGeneral: searchGatepasses(definitions.degree),
    searchDegreeGatepassesByRegistration: searchGatepassesByRegistration(definitions.degree),
    updateDegreeGatepass: updateGatepass(definitions.degree),
    deleteDegreeGatepass: deleteGatepass(definitions.degree),
    cancelDegreeGatepass: cancelGatepass(definitions.degree),
    getJuniorGatepasses: getAllGatepasses(definitions.junior),
    getJuniorGatepassById: getGatepassById(definitions.junior),
    searchJuniorGatepassesGeneral: searchGatepasses(definitions.junior),
    searchJuniorGatepassesByRegistration: searchGatepassesByRegistration(definitions.junior),
    updateJuniorGatepass: updateGatepass(definitions.junior),
    deleteJuniorGatepass: deleteGatepass(definitions.junior),
    cancelJuniorGatepass: cancelGatepass(definitions.junior)
};
