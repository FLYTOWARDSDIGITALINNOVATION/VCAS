const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/questionPaperController");

router.get("/staff/:staffId", ctrl.getMyPapers);
router.get("/:id", ctrl.getPaper);
router.post("/", ctrl.createPaper);
router.put("/:id", ctrl.updatePaper);
router.patch("/:id/status", ctrl.updateStatus);
router.delete("/:id", ctrl.deletePaper);

module.exports = router;
