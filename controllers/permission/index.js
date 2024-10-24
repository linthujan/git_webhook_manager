const { Permission } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { NO_PARAMS, sendAppError } = require("../../lib/appError");
const routeHandler = require("../../lib/routeHandler");
const { isNull } = require("../../lib/validation");

const create = routeHandler(async (req, res, extras) => {
    const { name } = req.body;

    if (isNull([name])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const findPermission = await Permission.findOne({
        where: {
            name: name,
        },
    });

    if (findPermission) {
        return sendAppError(extras, "Permission was already exist!", STATUS_CODE.BAD_REQUEST)
    }

    await Permission.create({
        name,
    }, { transaction: extras.transaction })
        .then(async (permission) => {

            await extras.transaction.commit();
            return res.sendRes(permission, {
                message: 'Permission saved successfully',
                status: STATUS_CODE.CREATED,
            });
        })
});

const getAll = routeHandler(async (req, res, extras) => {
    const permissions = await Permission.findAll({
        order: [['created_at', 'DESC'],],
        ...req.paginate,
    });

    return res.sendRes(permissions, {
        message: "Permissions loaded successfully",
        ...req.meta,
        total: await Permission.count(),
        status: STATUS_CODE.OK,
    });
}, false);

const getById = routeHandler(async (req, res, extras) => {
    const { permission_id } = req.params;

    const permission = await Permission.findOne({
        where: { permission_id },
    });

    if (!permission) {
        return sendAppError(extras, 'Permission not found', STATUS_CODE.NOT_FOUND);
    }

    return res.sendRes(permission, { message: 'Permission loaded successfully', status: STATUS_CODE.OK });
}, false);

const updateById = routeHandler(async (req, res, extras) => {
    const { permission_id } = req.params;
    const { name } = req.body;

    if (isNull([name])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const permission = await Permission.findOne({ where: { permission_id } });
    if (!permission) {
        return sendAppError(extras, 'Permission not found', STATUS_CODE.NOT_FOUND);
    }

    const updatedPermission = await permission.update({
        name,
    }, { transaction: extras.transaction, });

    await extras.transaction.commit();
    return res.sendRes(updatedPermission, { message: 'Permission updated successfully', status: STATUS_CODE.OK, });
});

const deleteById = routeHandler(async (req, res, extras) => {
    const { permission_id } = req.params;

    const permission = await Permission.findOne({ where: { permission_id } });
    if (!permission) {
        return sendAppError(extras, 'Permission not found', STATUS_CODE.NOT_FOUND);
    }

    await permission.destroy({ transaction: extras.transaction }).then(async (result) => {
        await extras.transaction.commit();
        return res.sendRes(null, { message: 'Permission deleted successfully', status: STATUS_CODE.OK });
    });
});

module.exports = {
    create,
    getAll,
    getById,
    updateById,
    deleteById,
};