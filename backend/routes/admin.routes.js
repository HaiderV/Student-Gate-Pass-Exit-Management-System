const express = require("express");

const {
    getAuditLogs,
    getDailyReport,
    getSummary,
    getCalendar,
    getRangeReport,
    getActiveGatepasses,
    getToday
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/audit-logs", getAuditLogs);
router.get("/daily-report", getDailyReport);
router.get("/summary", getSummary);
router.get("/calendar", getCalendar);
router.get("/report", getRangeReport);
router.get("/active-gatepasses", getActiveGatepasses);
router.get("/today", getToday);

module.exports = router;