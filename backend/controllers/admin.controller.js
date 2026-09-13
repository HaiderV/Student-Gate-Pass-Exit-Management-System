const supabase = require("../config/supabase");

const EVENT_TYPES = ["CREATED", "EXITED", "CANCELLED"];
const GATEPASS_FIELDS = "id, student_id, teacher_id, reason, status, created_at, exit_time, expires_at, signed_letter_url";
const DEGREE_STUDENT_FIELDS = "id, name, registration_number, course, year, section";
const JUNIOR_STUDENT_FIELDS = "id, name, registration_number, department, board, class_name, section";
const TEACHER_FIELDS = "id, name, department, teaching_level";

const isValidDate = value => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return date.toISOString().slice(0, 10) === value;
};

const isValidMonth = value => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
    const month = Number(value.slice(5));
    return month >= 1 && month <= 12;
};

const getBounds = date => ({
    from: `${date}T00:00:00.000Z`,
    to: `${date}T23:59:59.999Z`
});

const getMonthBounds = month => {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return {
        from: `${month}-01T00:00:00.000Z`,
        to: `${month}-${String(lastDay).padStart(2, "0")}T23:59:59.999Z`,
        lastDay
    };
};

const validateRange = (from, to) => {
    if (!isValidDate(from) || !isValidDate(to)) return "from and to must use YYYY-MM-DD format.";
    if (from > to) return "from must be earlier than or equal to to.";
    return null;
};

const getRowsByIds = async (table, fields, ids) => {
    if (!ids.length) return [];
    const { data, error } = await supabase.from(table).select(fields).in("id", ids);
    if (error) throw error;
    return data || [];
};

const loadEvents = async (from, to) => {
    const [degreeResult, juniorResult] = await Promise.all([
        supabase.from("degree_gatepass_events").select("id, gatepass_id, event_type, event_time, notes")
            .gte("event_time", from).lte("event_time", to).in("event_type", EVENT_TYPES).order("event_time", { ascending: false }),
        supabase.from("junior_gatepass_events").select("id, gatepass_id, event_type, event_time, notes")
            .gte("event_time", from).lte("event_time", to).in("event_type", EVENT_TYPES).order("event_time", { ascending: false })
    ]);
    if (degreeResult.error) throw degreeResult.error;
    if (juniorResult.error) throw juniorResult.error;

    const degreeEvents = (degreeResult.data || []).map(event => ({ ...event, gatepassType: "DEGREE", gatepassTable: "degree_gatepasses" }));
    const juniorEvents = (juniorResult.data || []).map(event => ({ ...event, gatepassType: "JUNIOR", gatepassTable: "junior_gatepasses" }));
    const allEvents = [...degreeEvents, ...juniorEvents];
    const degreeGatepasses = await getRowsByIds("degree_gatepasses", GATEPASS_FIELDS, degreeEvents.map(event => event.gatepass_id));
    const juniorGatepasses = await getRowsByIds("junior_gatepasses", GATEPASS_FIELDS, juniorEvents.map(event => event.gatepass_id));
    const degreeGatepassMap = new Map(degreeGatepasses.map(gatepass => [gatepass.id, gatepass]));
    const juniorGatepassMap = new Map(juniorGatepasses.map(gatepass => [gatepass.id, gatepass]));

    const degreeStudentIds = [...new Set(degreeGatepasses.map(gatepass => gatepass.student_id))];
    const juniorStudentIds = [...new Set(juniorGatepasses.map(gatepass => gatepass.student_id))];
    const teacherIds = [...new Set([...degreeGatepasses, ...juniorGatepasses].map(gatepass => gatepass.teacher_id))];
    const [degreeStudents, juniorStudents, teachers, uniqueNumbers] = await Promise.all([
        getRowsByIds("degree_students", DEGREE_STUDENT_FIELDS, degreeStudentIds),
        getRowsByIds("junior_students", JUNIOR_STUDENT_FIELDS, juniorStudentIds),
        getRowsByIds("teachers", TEACHER_FIELDS, teacherIds),
        juniorStudentIds.length
            ? supabase.from("junior_unique_numbers").select("id, student_id, unique_number, assigned_at, is_active").in("student_id", juniorStudentIds).then(result => {
                if (result.error) throw result.error;
                return result.data || [];
            })
            : []
    ]);
    const degreeStudentMap = new Map(degreeStudents.map(student => [student.id, student]));
    const juniorStudentMap = new Map(juniorStudents.map(student => [student.id, student]));
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher]));
    const uniqueNumberMap = new Map((uniqueNumbers || []).map(number => [number.student_id, number]));

    return allEvents.map(event => {
        const gatepass = event.gatepassType === "DEGREE"
            ? degreeGatepassMap.get(event.gatepass_id)
            : juniorGatepassMap.get(event.gatepass_id);
        const student = gatepass && event.gatepassType === "DEGREE"
            ? degreeStudentMap.get(gatepass.student_id)
            : gatepass ? juniorStudentMap.get(gatepass.student_id) : null;
        const teacher = gatepass ? teacherMap.get(gatepass.teacher_id) : null;
        const uniqueNumber = gatepass && event.gatepassType === "JUNIOR"
            ? uniqueNumberMap.get(gatepass.student_id)
            : null;

        return {
            id: event.id,
            gatepassId: event.gatepass_id,
            gatepassType: event.gatepassType,
            eventType: event.event_type,
            eventTime: event.event_time,
            notes: event.notes,
            status: gatepass?.status || null,
            reason: gatepass?.reason || null,
            createdAt: gatepass?.created_at || null,
            exitTime: gatepass?.exit_time || null,
            expiresAt: gatepass?.expires_at || null,
            student: student || null,
            teacher: teacher || null,
            uniqueNumber: uniqueNumber || null
        };
    });
};

const enrichGatepassRows = async (degreeGatepasses, juniorGatepasses) => {
    const degreeRows = degreeGatepasses || [];
    const juniorRows = juniorGatepasses || [];
    const degreeStudentIds = [...new Set(degreeRows.map(gatepass => gatepass.student_id))];
    const juniorStudentIds = [...new Set(juniorRows.map(gatepass => gatepass.student_id))];
    const teacherIds = [...new Set([...degreeRows, ...juniorRows].map(gatepass => gatepass.teacher_id))];
    const [degreeStudents, juniorStudents, teachers, uniqueNumbers] = await Promise.all([
        getRowsByIds("degree_students", DEGREE_STUDENT_FIELDS, degreeStudentIds),
        getRowsByIds("junior_students", JUNIOR_STUDENT_FIELDS, juniorStudentIds),
        getRowsByIds("teachers", TEACHER_FIELDS, teacherIds),
        juniorStudentIds.length
            ? supabase.from("junior_unique_numbers").select("id, student_id, unique_number, assigned_at, is_active").in("student_id", juniorStudentIds).then(result => {
                if (result.error) throw result.error;
                return result.data || [];
            })
            : []
    ]);
    const degreeStudentMap = new Map(degreeStudents.map(student => [student.id, student]));
    const juniorStudentMap = new Map(juniorStudents.map(student => [student.id, student]));
    const teacherMap = new Map(teachers.map(teacher => [teacher.id, teacher]));
    const uniqueMap = new Map((uniqueNumbers || []).map(number => [number.student_id, number]));

    return [
        ...degreeRows.map(gatepass => ({ gatepassId: gatepass.id, gatepassType: "DEGREE", student: degreeStudentMap.get(gatepass.student_id) || null, teacher: teacherMap.get(gatepass.teacher_id) || null, reason: gatepass.reason, createdAt: gatepass.created_at, expiresAt: gatepass.expires_at, status: gatepass.status, uniqueNumber: null })),
        ...juniorRows.map(gatepass => ({ gatepassId: gatepass.id, gatepassType: "JUNIOR", student: juniorStudentMap.get(gatepass.student_id) || null, teacher: teacherMap.get(gatepass.teacher_id) || null, reason: gatepass.reason, createdAt: gatepass.created_at, expiresAt: gatepass.expires_at, status: gatepass.status, uniqueNumber: uniqueMap.get(gatepass.student_id) || null }))
    ];
};

const getAuditRows = async ({ from, to, actorType, action, entityType } = {}) => {
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (actorType) query = query.eq("actor_type", actorType);
    if (action) query = query.eq("action", action);
    if (entityType) query = query.eq("entity_type", entityType);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

const summarizeEvents = events => ({
    total: events.length,
    totalEvents: events.length,
    created: events.filter(event => event.eventType === "CREATED").length,
    exited: events.filter(event => event.eventType === "EXITED").length,
    cancelled: events.filter(event => event.eventType === "CANCELLED").length
});

const splitSummary = events => ({
    total: events.length,
    created: events.filter(event => event.eventType === "CREATED").length,
    exited: events.filter(event => event.eventType === "EXITED").length,
    cancelled: events.filter(event => event.eventType === "CANCELLED").length
});

const getAuditLogs = async (req, res) => {
    try {
        const { from, to, actor_type: actorType, action, entity_type: entityType } = req.query;
        if (from || to) {
            const error = validateRange(from, to);
            if (error) return res.status(400).json({ error });
        }
        const logs = await getAuditRows({
            from: from ? getBounds(from).from : undefined,
            to: to ? getBounds(to).to : undefined,
            actorType,
            action,
            entityType
        });
        return res.status(200).json({ count: logs.length, logs });
    } catch (error) {
        console.error("Audit logs error:", error);
        return res.status(500).json({ error: "Failed to fetch audit logs." });
    }
};

const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        if (!isValidDate(date)) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
        const bounds = getBounds(date);
        const [events, auditLogs] = await Promise.all([
            loadEvents(bounds.from, bounds.to),
            getAuditRows(bounds)
        ]);
        const degree = events.filter(event => event.gatepassType === "DEGREE");
        const junior = events.filter(event => event.gatepassType === "JUNIOR");
        return res.status(200).json({ date, summary: summarizeEvents(events), degree: splitSummary(degree), junior: splitSummary(junior), events, auditLogs });
    } catch (error) {
        console.error("Daily report error:", error);
        return res.status(500).json({ error: "Failed to fetch daily report." });
    }
};

const getCalendar = async (req, res) => {
    try {
        const { month } = req.query;
        if (!isValidMonth(month)) return res.status(400).json({ error: "Invalid month format. Use YYYY-MM." });
        const bounds = getMonthBounds(month);
        const events = await loadEvents(bounds.from, bounds.to);
        const days = [];
        for (let day = 1; day <= bounds.lastDay; day += 1) {
            const date = `${month}-${String(day).padStart(2, "0")}`;
            const dayEvents = events.filter(event => event.eventTime.slice(0, 10) === date);
            days.push({ date, ...summarizeEvents(dayEvents), degree: dayEvents.filter(event => event.gatepassType === "DEGREE").length, junior: dayEvents.filter(event => event.gatepassType === "JUNIOR").length });
        }
        return res.status(200).json({ month, days });
    } catch (error) {
        console.error("Calendar error:", error);
        return res.status(500).json({ error: "Failed to fetch calendar data." });
    }
};

const getRangeReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const rangeError = validateRange(from, to);
        if (rangeError) return res.status(400).json({ error: rangeError });
        const bounds = { from: getBounds(from).from, to: getBounds(to).to };
        const [events, auditLogs] = await Promise.all([loadEvents(bounds.from, bounds.to), getAuditRows(bounds)]);
        const degree = events.filter(event => event.gatepassType === "DEGREE");
        const junior = events.filter(event => event.gatepassType === "JUNIOR");
        return res.status(200).json({ from, to, summary: summarizeEvents(events), degree: splitSummary(degree), junior: splitSummary(junior), auditActivity: { count: auditLogs.length, logs: auditLogs }, events });
    } catch (error) {
        console.error("Range report error:", error);
        return res.status(500).json({ error: "Failed to fetch date-range report." });
    }
};

const getActiveGatepasses = async (req, res) => {
    try {
        const [degreeResult, juniorResult] = await Promise.all([
            supabase.from("degree_gatepasses").select(GATEPASS_FIELDS).eq("status", "ACTIVE").order("created_at", { ascending: false }),
            supabase.from("junior_gatepasses").select(GATEPASS_FIELDS).eq("status", "ACTIVE").order("created_at", { ascending: false })
        ]);
        if (degreeResult.error) throw degreeResult.error;
        if (juniorResult.error) throw juniorResult.error;
        const active = await enrichGatepassRows(degreeResult.data || [], juniorResult.data || []);
        return res.status(200).json({ count: active.length, gatepasses: active });
    } catch (error) {
        console.error("Active gatepasses error:", error);
        return res.status(500).json({ error: "Failed to fetch active gatepasses." });
    }
};

const getToday = async (req, res) => {
    try {
        const date = new Date().toISOString().slice(0, 10);
        const bounds = getBounds(date);
        const [events, activeDegree, activeJunior] = await Promise.all([
            loadEvents(bounds.from, bounds.to),
            supabase.from("degree_gatepasses").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
            supabase.from("junior_gatepasses").select("id", { count: "exact", head: true }).eq("status", "ACTIVE")
        ]);
        if (activeDegree.error) throw activeDegree.error;
        if (activeJunior.error) throw activeJunior.error;
        const summary = summarizeEvents(events);
        const created = events.filter(event => event.eventType === "CREATED");
        return res.status(200).json({ date, totalGatepassesCreated: created.length, activeGatepasses: (activeDegree.count || 0) + (activeJunior.count || 0), exitedGatepasses: summary.exited, cancelledGatepasses: summary.cancelled, degreeCount: created.filter(event => event.gatepassType === "DEGREE").length, juniorCount: created.filter(event => event.gatepassType === "JUNIOR").length, recentEvents: events.slice(0, 10) });
    } catch (error) {
        console.error("Today overview error:", error);
        return res.status(500).json({ error: "Failed to fetch today's overview." });
    }
};

const getSummary = async (req, res) => {
    try {
        const countRows = async (table, filters = []) => {
            let query = supabase.from(table).select("id", { count: "exact", head: true });
            for (const [method, args] of filters) query = query[method](...args);
            const result = await query;
            if (result.error) throw result.error;
            return result.count || 0;
        };
        const [degreeStudents, juniorStudents, teachers, degreeGatepasses, juniorGatepasses, assignedNumbers, activeNumbers, degreeActive, degreeExited, degreeCancelled, juniorActive, juniorExited, juniorCancelled, recentAuditLogs] = await Promise.all([
            countRows("degree_students"), countRows("junior_students"), countRows("teachers"), countRows("degree_gatepasses"), countRows("junior_gatepasses"), countRows("junior_unique_numbers"), countRows("junior_unique_numbers", [["eq", ["is_active", true]]]), countRows("degree_gatepasses", [["eq", ["status", "ACTIVE"]]]), countRows("degree_gatepasses", [["eq", ["status", "EXITED"]]]), countRows("degree_gatepasses", [["eq", ["status", "CANCELLED"]]]), countRows("junior_gatepasses", [["eq", ["status", "ACTIVE"]]]), countRows("junior_gatepasses", [["eq", ["status", "EXITED"]]]), countRows("junior_gatepasses", [["eq", ["status", "CANCELLED"]]]), supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10)
        ]);
        if (recentAuditLogs.error) throw recentAuditLogs.error;
        return res.status(200).json({ students: { totalDegreeStudents: degreeStudents, totalJuniorStudents: juniorStudents, totalStudents: degreeStudents + juniorStudents }, teachers: { totalTeachers: teachers }, gatepasses: { totalDegreeGatepasses: degreeGatepasses, totalJuniorGatepasses: juniorGatepasses, totalGatepasses: degreeGatepasses + juniorGatepasses, activeGatepasses: degreeActive + juniorActive, exitedGatepasses: degreeExited + juniorExited, cancelledGatepasses: degreeCancelled + juniorCancelled }, juniorUniqueNumbers: { totalAssignedUniqueNumbers: assignedNumbers, activeUniqueNumbers: activeNumbers }, recentAuditLogs: recentAuditLogs.data || [] });
    } catch (error) {
        console.error("Summary error:", error);
        return res.status(500).json({ error: "Failed to fetch system summary." });
    }
};

module.exports = { getAuditLogs, getDailyReport, getCalendar, getRangeReport, getActiveGatepasses, getToday, getSummary };
