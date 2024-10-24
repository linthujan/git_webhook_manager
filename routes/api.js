const express = require("express");
const router = express.Router();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `${global.__basedir}/storage`);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

//  Import Middlewares
const jwtAuth = require("../middlewares/jwtAuth");

//  Import Controllers
const authController = require("../controllers/auth");
const userController = require("../controllers/user");
const permissionController = require("../controllers/permission");
const roleController = require("../controllers/role");
const versionController = require("../controllers/version");
const settingController = require("../controllers/setting");

//  Routes

router.route("/test").get((req, res) => {
    res.sendStatus(1)
});

// Auth
router.route("/auth/login")
    .post(authController.login);
router.route("/verify/login")
    .post(authController.verifyLogin);
router.route("/auth")
    .get(jwtAuth, authController.getAuthUser);

// User
router.route("/user")
    .post(jwtAuth, userController.create);
router.route("/user")
    .get(jwtAuth, userController.getAll);
router.route("/user/:user_id")
    .get(jwtAuth, userController.getById)
    .put(jwtAuth, userController.updateById)
    .delete(jwtAuth, userController.deleteById);
router.route("/user/recover")
    .post(userController.recovery);
router.route("/verify/recover")
    .post(userController.verifyRecovery);
router.route("/user/forgot")
    .post(userController.forgotPassword);
router.route("/verify/forgot")
    .post(userController.verifyForgotPassword);

// Permission
router.route("/permission")
    .post(jwtAuth, permissionController.create)
    .get(jwtAuth, permissionController.getAll);
router.route("/permission/:permission_id")
    .get(jwtAuth, permissionController.getById)
    .put(jwtAuth, permissionController.updateById)
    .delete(jwtAuth, permissionController.deleteById);

// Role
router.route("/role")
    .post(jwtAuth, roleController.create)
    .get(jwtAuth, roleController.getAll);
router.route("/role/:role_id")
    .get(jwtAuth, roleController.getById)
    .put(jwtAuth, roleController.updateById)
    .delete(jwtAuth, roleController.deleteById);

// RolePermission
router.route("/role/:role_id/permission")
    .put(jwtAuth, roleController.updatePermissionsById);

// Version
router.route("/version")
    .post(jwtAuth, versionController.updateVersion)
    .get(versionController.getVersion);

// Setting
router.route("/setting")
    .post(jwtAuth, settingController.update)
    .get(jwtAuth, settingController.getAll);

module.exports = router;