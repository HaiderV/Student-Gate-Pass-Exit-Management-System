const supabase = require("../config/supabase");

const expireGatepasses = async () => {
    try {
        const nowIso = new Date().toISOString();
        
        // Update expired degree gatepasses
        const { error: degreeErr } = await supabase
            .from("degree_gatepasses")
            .update({ status: "EXPIRED" })
            .eq("status", "ACTIVE")
            .lt("expires_at", nowIso);
            
        if (degreeErr) {
            console.error("Error expiring degree gatepasses:", degreeErr);
        }

        // Update expired junior gatepasses
        const { error: juniorErr } = await supabase
            .from("junior_gatepasses")
            .update({ status: "EXPIRED" })
            .eq("status", "ACTIVE")
            .lt("expires_at", nowIso);

        if (juniorErr) {
            console.error("Error expiring junior gatepasses:", juniorErr);
        }

        return { success: true };
    } catch (err) {
        console.error("expireGatepasses exception:", err);
        return { success: false, error: err.message };
    }
};

module.exports = expireGatepasses;