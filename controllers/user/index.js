const { User, Role, Permission } = require("../../models");
const { NO_PARAMS, } = require("../../lib/errorMessage");
const { STATUS_CODE, sendMail, hideMailPartially } = require("../../lib/utility");
const routeHandler = require("../../lib/routeHandler");
const { isNull } = require("../../lib/validation");
const { sendAppError } = require("../../lib/appError");
const { Op } = require("sequelize");
const { createUniqueOTP } = require("../../services");

const create = routeHandler(async (req, res, extras) => {
	const {
		first_name,
		last_name,
		mobile,
		email,
		role_id,
		per_sms_price,
		mask,
	} = req.body;

	if (isNull([first_name, last_name, mobile, email, per_sms_price, mask, role_id])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
	}

	const findUser = await User.findOne({
		where: {
			[Op.or]: {
				mobile,
				email,
			},
			is_verified: true,
		},
		paranoid: false,
	});

	if (findUser?.isSoftDeleted()) {
		return sendAppError(extras, "User account deactivated", STATUS_CODE.GONE);
	}
	if (findUser?.mobile == mobile) {
		return sendAppError(extras, "Mobile number already registered", STATUS_CODE.BAD_REQUEST);
	}
	if (findUser?.email == email) {
		return sendAppError(extras, "E-mail address already registered", STATUS_CODE.BAD_REQUEST);
	}

	const findRole = await Role.findOne({ where: { role_id }, });
	if (!findRole) {
		return sendAppError(extras, "Role not found!", STATUS_CODE.NOT_FOUND)
	}

	const [user, isCreated] = await User.upsert({
		first_name,
		last_name,
		mobile,
		email,
		mask,
		per_sms_price,
		password: "kelaxa@123",
		role_id: findRole.role_id,
		is_verified: true,
	}, { transaction: extras.transaction });

	if (!isCreated) {
		await user.reload({ transaction: extras.transaction })
	}

	await extras.transaction.commit();
	return res.sendRes(user, { message: 'User created successfully', status: STATUS_CODE.OK });
});

const getAll = routeHandler(async (req, res, extras) => {
	const users = await User.findAll({
		...req.paginate,
	});

	return res.sendRes(users, {
		message: 'Users loaded successfully',
		...req.meta,
		total: await User.count(),
		status: STATUS_CODE.OK,
	});
}, false);

const getById = routeHandler(async (req, res, extras) => {
	const { user_id } = req.params;

	const user = await User.findOne({
		where: { user_id },
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

	if (!user) {
		return sendAppError(extras, 'User not found', STATUS_CODE.NOT_FOUND);
	}

	return res.sendRes(user, { message: 'User loaded successfully', status: STATUS_CODE.OK });
}, false);

const updateById = routeHandler(async (req, res, extras) => {
	const { user_id } = req.params;
	const { first_name, last_name, mobile, email, password, password_confirm, per_sms_price, mask, } = req.body;

	if (password && password.length < 8) {
		return sendAppError(extras, "Please choose a longer password", STATUS_CODE.BAD_REQUEST)
	}

	if (password != password_confirm) {
		return sendAppError(extras, "Passwords did't match", STATUS_CODE.BAD_REQUEST)
	}

	const user = await User.findOne({ where: { user_id, is_verified: true } });
	if (!user) {
		return sendAppError(extras, 'User not found', STATUS_CODE.NOT_FOUND);
	}

	if (email || mobile) {
		const findUser = await User.findOne({
			where: {
				[Op.or]: [
					mobile ? { mobile } : null,
					email ? { email } : null,
				],
				is_verified: true,
				user_id: {
					[Op.not]: user_id,
				}
			}
		});

		if (findUser && findUser.mobile == mobile) {
			return sendAppError(extras, "Mobile number already registered", STATUS_CODE.BAD_REQUEST);
		}
		if (findUser && findUser.email == email) {
			return sendAppError(extras, "E-mail address already registered", STATUS_CODE.BAD_REQUEST);
		}
	}

	await user.update({
		first_name,
		last_name,
		mobile,
		email,
		mask,
		password,
		per_sms_price,
	}, { transaction: extras.transaction });

	await extras.transaction.commit();
	return res.sendRes(user, { message: 'User updated successfully', status: STATUS_CODE.OK });
});

const deleteById = routeHandler(async (req, res, extras) => {
	const { user_id } = req.params;

	const user = await User.findOne({ where: { user_id } });
	if (!user) {
		return sendAppError(extras, 'User not found', STATUS_CODE.NOT_FOUND);
	}

	await user.destroy({ transaction: extras.transaction });
	await extras.transaction.commit();
	return res.sendRes(null, { message: 'User account deactivated successfully', status: STATUS_CODE.OK });
});

const recovery = routeHandler(async (req, res, extras) => {
	const {
		username,
	} = req.body;

	if (isNull([username])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
	}

	const findUser = await User.findOne({
		where: {
			[Op.or]: {
				mobile: username,
				email: username,
			},
			is_verified: true,
		},
		paranoid: false,
	});

	if (!findUser) {
		return sendAppError(extras, "User not found", STATUS_CODE.NOT_FOUND);
	}

	if (findUser.isSoftDeleted() == false) {
		return sendAppError(extras, "User account already activated", STATUS_CODE.BAD_REQUEST);
	}

	const otp_code = await createUniqueOTP();
	const otp_expiry_at = new Date();
	otp_expiry_at.setMinutes(otp_expiry_at.getMinutes() + 5);

	await findUser.update({
		otp_code,
		otp_expiry_at,
	}, { transaction: extras.transaction });

	await sendMail(findUser.email, "Account Restoration", `Your verification otp is ${findUser.otp_code}, will expiry at ${findUser.otp_expiry_at.toLocaleString()}`);

	await extras.transaction.commit();

	return res.sendRes({
		user_id: findUser.user_id,
		email: hideMailPartially(findUser.email),
		otp_expiry_at,
	}, { message: 'OTP send successfully', status: STATUS_CODE.OK });
});

const verifyRecovery = routeHandler(async (req, res, extras) => {
	const {
		user_id,
		otp_code,
	} = req.body;

	if (isNull([user_id, otp_code])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST);
	}

	const findUser = await User.findOne({
		where: {
			user_id: user_id,
			is_verified: true,
		},
		paranoid: false,
	});
	if (!findUser) {
		return sendAppError(extras, "User not found", STATUS_CODE.NOT_FOUND);
	}
	if (findUser.isSoftDeleted() == false) {
		return sendAppError(extras, "User account already activated", STATUS_CODE.BAD_REQUEST);
	}
	if (findUser.otp_code != otp_code) {
		return sendAppError(extras, "Invalid OTP", STATUS_CODE.CONFLICT);
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

	await findUser.restore({ transaction: extras.transaction });

	await extras.transaction.commit();
	return res.sendRes(findUser, {
		message: 'User account restored successfully',
		status: STATUS_CODE.OK,
	});
});

const forgotPassword = routeHandler(async (req, res, extras) => {
	const {
		username,
	} = req.body;

	if (isNull([username])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
	}

	const findUser = await User.findOne({
		where: {
			[Op.or]: {
				mobile: username,
				email: username,
			},
			is_verified: true,
		},
	});
	if (!findUser) {
		return sendAppError(extras, "User not found", STATUS_CODE.NOT_FOUND);
	}

	const otp_code = await createUniqueOTP();
	const otp_expiry_at = new Date();
	otp_expiry_at.setMinutes(otp_expiry_at.getMinutes() + 5);

	await findUser.update({
		otp_code,
		otp_expiry_at,
	}, { transaction: extras.transaction });

	await sendMail(findUser.email, "PayAxa Forgot Password", `Your verification otp is ${findUser.otp_code}, will expiry at ${findUser.otp_expiry_at.toLocaleString()}`);

	await extras.transaction.commit();

	return res.sendRes({
		user_id: findUser.user_id,
		email: hideMailPartially(findUser.email),
		otp_expiry_at,
	}, { message: 'OTP send successfully', status: STATUS_CODE.OK });
});

const verifyForgotPassword = routeHandler(async (req, res, extras) => {
	const {
		user_id,
		otp_code,
		password,
		password_confirm,
	} = req.body;

	if (isNull([user_id, otp_code, password, password_confirm])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST);
	}

	const findUser = await User.findOne({
		where: {
			user_id: user_id,
			is_verified: true,
		},
	});
	if (!findUser) {
		return sendAppError(extras, "User not found", STATUS_CODE.NOT_FOUND);
	}
	if (findUser.otp_code != otp_code) {
		return sendAppError(extras, "Invalid OTP", STATUS_CODE.CONFLICT);
	}

	const current_time = new Date();
	const expire_at = new Date(findUser.otp_expiry_at);
	console.log("More", (expire_at - current_time) / (1000), "s");

	if (expire_at < current_time) {
		return sendAppError(extras, "OTP expired", STATUS_CODE.EXPIRED);
	}

	if (password.length < 8) {
		return sendAppError(extras, "Please choose a longer password", STATUS_CODE.BAD_REQUEST)
	}

	if (password != password_confirm) {
		return sendAppError(extras, "Passwords did't match", STATUS_CODE.BAD_REQUEST)
	}

	await findUser.update({
		otp_code: null,
		otp_expiry_at: null,
		password: password,
	}, { transaction: extras.transaction });

	await extras.transaction.commit();
	return res.sendRes(findUser, {
		message: 'Password changed successfully',
		status: STATUS_CODE.OK,
	});
});

module.exports = {
	create,
	getAll,
	getById,
	updateById,
	deleteById,
	recovery,
	verifyRecovery,
	forgotPassword,
	verifyForgotPassword,
};
