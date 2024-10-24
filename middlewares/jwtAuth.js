const { STATUS_CODE } = require("../lib/utility");

const AppError = require("../lib/appError");

const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Invalid authorization header", STATUS_CODE.UNAUTHORIZED));
    }

    const token = authHeader.split(" ").pop();
    if (!token) {
        return next(new AppError("Authorization token not found", STATUS_CODE.UNAUTHORIZED));
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ where: { user_id: payload.user_id } });
        if (user) {
            req.auth = user.toJSON();
            next();
        } else {
            return next(new AppError("Invalid token", STATUS_CODE.UNAUTHORIZED));
        }

    } catch (error) {
        console.log(error);
        next(new AppError(error.name, STATUS_CODE.UNAUTHORIZED));
    }
};