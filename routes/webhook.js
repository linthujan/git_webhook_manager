const express = require("express");
const router = express.Router();

//  Import Controllers
const webhookController = require("../controllers/webhook");

//  Routes
router.route("/test").get((req, res) => {
    res.sendStatus(1)
});

// Push
router.route("/push")
    .post(webhookController.repositoryHook);

module.exports = router;