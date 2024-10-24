const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { sendAppError } = require("../../lib/appError");
const { User, Role, Permission, MonthlySms } = require("../../models");
const routeHandler = require("../../lib/routeHandler");
const { STATUS_CODE, generateAccessToken, sendMail, hideMailPartially } = require("../../lib/utility");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const { createUniqueOTP } = require("../../services");

const login = routeHandler(async (req, res, extras) => {
    const {
        username,
        password,
    } = req.body;

    if (isNull([username])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const findUser = await User.findOne({
        where: {
            [Op.or]: {
                mobile: username,
                email: username
            },
            is_verified: true,
        },
        include: [
            {
                model: Role,
                as: 'role',
                paranoid: false,
                include: [{
                    model: Permission,
                    as: 'permissions',
                    paranoid: false,
                }]
            },
        ],
        paranoid: false,
    });

    if (!findUser) {
        return sendAppError(extras, "Mobile or E-mail not found", STATUS_CODE.NOT_FOUND);
    }

    if (findUser.isSoftDeleted()) {
        return sendAppError(extras, "User account deactivated", STATUS_CODE.GONE);
    }

    if (password) {
        if (!bcrypt.compareSync(password, findUser.password_hash)) {
            return sendAppError(extras, "Login Failed", STATUS_CODE.BAD_REQUEST);
        }

        await extras.transaction.commit();

        const access_token = generateAccessToken({
            user_id: findUser.user_id,
        });

        delete findUser.dataValues.otp_code;
        delete findUser.dataValues.otp_expiry_at;
        delete findUser.dataValues.password_hash;

        return res.sendRes({ user: findUser, access_token }, {
            message: 'Login success',
            status: STATUS_CODE.OK,
        });
    }
    else {
        const otp_code = await createUniqueOTP();
        const otp_expiry_at = new Date();
        otp_expiry_at.setMinutes(otp_expiry_at.getMinutes() + 5);

        await findUser.update({
            otp_code,
            otp_expiry_at,
        }, { transaction: extras.transaction });

        await sendMail(findUser.email, "PayAxa Login", `Your verification otp is ${findUser.otp_code}, will expiry at ${findUser.otp_expiry_at.toLocaleString()}`);
        await extras.transaction.commit();

        delete findUser.dataValues.otp_code;
        delete findUser.dataValues.password_hash;
        return res.sendRes({
            email: hideMailPartially(findUser.email),
            otp_expiry_at,
        }, { message: 'OTP send successfully', status: STATUS_CODE.OK });
    }
});

const verifyLogin = routeHandler(async (req, res, extras) => {
    const {
        otp_code,
    } = req.body;

    if (isNull([otp_code])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST);
    }

    const findUser = await User.findOne({
        where: { otp_code },
        include: [
            {
                model: Role,
                as: 'role',
                paranoid: false,
                include: [{
                    model: Permission,
                    as: 'permissions',
                    paranoid: false,
                }]
            },
        ],
    });

    if (!findUser) {
        return sendAppError(extras, "Invalid OTP", STATUS_CODE.NOT_FOUND);
    }

    const current_time = new Date();
    const expire_at = new Date(findUser.otp_expiry_at);
    console.log("More", (expire_at - current_time) / (1000), "s");

    if (expire_at < current_time) {
        return sendAppError(extras, "OTP expired", STATUS_CODE.EXPIRED);
    }

    await findUser.update({
        otp_code: null,
        otp_expiry_at: null,
    }, { transaction: extras.transaction });

    await extras.transaction.commit();

    const access_token = generateAccessToken({
        user_id: findUser.dataValues.user_id,
        role_id: findUser.dataValues.role_id,
    });

    delete findUser.dataValues.otp_code;
    delete findUser.dataValues.otp_expiry_at;
    delete findUser.dataValues.password_hash;

    return res.sendRes({ user: findUser, access_token }, {
        message: 'Login success',
        status: STATUS_CODE.OK,
    });
});

const getAuthUser = routeHandler(async (req, res, extras) => {
    const { user_id } = req.auth;

    const user = await User.findOne({
        where: { user_id },
        include: [
            {
                model: MonthlySms,
                as: 'monthlySmses',
                limit: 12,
                order: [['created_at', 'DESC'],],
            },
        ],
    });

    if (!user) {
        return sendAppError(extras, 'User not found', STATUS_CODE.NOT_FOUND);
    }

    return res.sendRes(user, { message: 'User loaded successfully', status: STATUS_CODE.OK });
}, false);

module.exports = {
    login,
    verifyLogin,
    getAuthUser,
};