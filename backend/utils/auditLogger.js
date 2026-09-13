const supabase = require("../config/supabase");

const createAuditLog = async ({
    action,
    entity_type,
    entity_id,
    description,
    actor_type = "SYSTEM"
}) => {
    try {
        const { error } = await supabase
            .from("audit_logs")
            .insert({
                actor_type,
                action,
                entity_type,
                entity_id,
                description
            });

        if (error) {
            console.error("Audit log error:", error);
        }
    } catch (error) {
        console.error("Audit logger failed:", error);
    }
};

module.exports = createAuditLog;