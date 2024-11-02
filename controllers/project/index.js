const { User, Role, Permission, Project } = require("../../models");
const { NO_PARAMS, } = require("../../lib/errorMessage");
const { STATUS_CODE, sendMail, hideMailPartially } = require("../../lib/utility");
const routeHandler = require("../../lib/routeHandler");
const { isNull } = require("../../lib/validation");
const { sendAppError } = require("../../lib/appError");
const { Op } = require("sequelize");
const { createUniqueOTP } = require("../../services");
const { default: axios } = require("axios");
const { GITHUB_API, GITHUB_SECRET, GITHUB_WEBHOOK } = process.env;
const crypto = require('crypto');

const create = routeHandler(async (req, res, extras) => {
	const {
		type,
		branch,
		path,
		git_url,
		command,
	} = req.body;

	if (isNull([type, branch, path, git_url, command])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
	}

	const findProject = await Project.findOne({
		where: {
			[Op.or]: {
				path,
				git_url,
			},
			type,
		},
		paranoid: false,
	});

	if (findProject?.isSoftDeleted()) {
		return sendAppError(extras, "Project deactivated", STATUS_CODE.GONE);
	}
	if (findProject?.path == path) {
		return sendAppError(extras, "Path already used", STATUS_CODE.BAD_REQUEST);
	}
	if (findProject?.git_url == git_url) {
		return sendAppError(extras, "GitHub url already used", STATUS_CODE.BAD_REQUEST);
	}

	const [owner, repo] = git_url.replace('https://github.com/', '').split('/');
	console.log(owner, repo);


	const repositoryResponse = await axios.get(`${GITHUB_API}/${owner}/${repo}`, {
		headers: {
			Authorization: `Bearer ${GITHUB_SECRET}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	const branchResponse = await axios.get(`${GITHUB_API}/${owner}/${repo}/branches?per_page=10000`, {
		headers: {
			Authorization: `Bearer ${GITHUB_SECRET}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	if (!branchResponse.data.find(b => b.name == branch)) {
		return sendAppError(extras, "Branch not valid", STATUS_CODE.BAD_REQUEST);
	}

	const { name } = repositoryResponse.data;
	const secret = crypto.randomBytes(32).toString('base64');
	await axios.post(`${GITHUB_API}/${owner}/${repo}/hooks`, {
		active: true,
		events: [
			'push',
		],
		config: {
			url: GITHUB_WEBHOOK,
			content_type: 'json',
			insecure_ssl: '1',
			secret,
		},
	}, {
		headers: {
			Authorization: `Bearer ${GITHUB_SECRET}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});

	const project = await Project.create({
		name,
		type,
		branch,
		path,
		repository_id: repositoryResponse.data.id,
		git_url,
		secret,
		command,
	}, { transaction: extras.transaction });

	await extras.transaction.commit();
	return res.sendRes(project, { message: 'Project created successfully', status: STATUS_CODE.OK });
});

const getAll = routeHandler(async (req, res, extras) => {
	const projects = await Project.findAll({
		...req.paginate,
	});

	return res.sendRes(projects, {
		message: 'Projects loaded successfully',
		...req.meta,
		total: await Project.count(),
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
	const { project_id } = req.params;
	const { type, branch, path, git_url, command, } = req.body;

	const project = await Project.findOne({ where: { project_id } });
	if (!project) {
		return sendAppError(extras, 'Project not found', STATUS_CODE.NOT_FOUND);
	}

	if (isNull([type, branch, path, git_url, command])) {
		return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
	}

	const findProject = await Project.findOne({
		where: {
			[Op.or]: {
				path,
				git_url,
			},
			type,
			project_id: {
				[Op.not]: project_id,
			}
		},
		paranoid: false,
	});

	if (findProject?.path == path) {
		return sendAppError(extras, "Path already used by another project", STATUS_CODE.BAD_REQUEST);
	}
	if (findProject?.git_url == git_url) {
		return sendAppError(extras, "GitHub url already used by another project", STATUS_CODE.BAD_REQUEST);
	}

	await project.update({
		type,
		branch,
		path,
		git_url,
		command,
	}, { transaction: extras.transaction });

	await extras.transaction.commit();
	return res.sendRes(project, { message: 'Project updated successfully', status: STATUS_CODE.OK });
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
