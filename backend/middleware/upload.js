const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];
        if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF and Image files (JPEG, JPG, PNG, WEBP) are allowed."));
        }
    },
});

module.exports = upload;