const { Role, Permission } = require("../../models");
const { STATUS_CODE } = require("../../lib/utility");
const { sendAppError } = require("../../lib/appError");
const routeHandler = require("../../lib/routeHandler");
const { isNull } = require("../../lib/validation");
const { NO_PARAMS } = require("../../lib/errorMessage");
const { Op } = require("sequelize");

const create = routeHandler(async (req, res, extras) => {
    const { name } = req.body;

    if (isNull([name])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const findRole = await Role.findOne({
        where: {
            name: name,
        },
    });

    if (findRole) {
        return sendAppError(extras, "Role was already exist!", STATUS_CODE.BAD_REQUEST)
    }

    await Role.create({
        name,
    }, { transaction: extras.transaction })
        .then(async (role) => {

            await extras.transaction.commit();
            return res.sendRes(role, {
                message: 'Role saved successfully',
                status: STATUS_CODE.CREATED,
            });
        })
});

const getAll = routeHandler(async (req, res, extras) => {
    const roles = await Role.findAll({
        order: [['created_at', 'DESC'],],
        ...req.paginate,
    });

    return res.sendRes(roles, {
        message: "Roles loaded successfully",
        ...req.meta,
        total: await Role.count(),
        status: STATUS_CODE.OK,
    });
}, false);

const getById = routeHandler(async (req, res, extras) => {
    const { role_id } = req.params;

    const role = await Role.findOne({
        where: { role_id },
    });

    if (!role) {
        return sendAppError(extras, 'Role not found', STATUS_CODE.NOT_FOUND);
    }

    const rolePermissions = await role.getPermissions({ joinTableAttributes: [], });
    const allPermissions = await Permission.findAll();
    const modules = {};

    allPermissions.map(permission => {
        const module_permission = permission.name.split('.');

        if (modules[module_permission[0]] == undefined) {
            modules[module_permission[0]] = {};
        }
        modules[module_permission[0]][module_permission[1]] = {
            permission_id: permission.permission_id,
            value: 0,
        };
    })
    rolePermissions.map(permission => {
        const module_permission = permission.name.split('.');

        if (modules[module_permission[0]] == undefined) {
            modules[module_permission[0]] = {};
        }
        modules[module_permission[0]][module_permission[1]] = {
            permission_id: permission.permission_id,
            value: 1,
        };
    })
    role.dataValues.permissions = modules;

    return res.sendRes(role, { message: 'Role loaded successfully', status: STATUS_CODE.OK });
}, false);

const updateById = routeHandler(async (req, res, extras) => {
    const { role_id } = req.params;
    const { name } = req.body;

    if (isNull([name])) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const role = await Role.findOne({ where: { role_id } });
    if (!role) {
        return sendAppError(extras, 'Role not found', STATUS_CODE.NOT_FOUND);
    }

    const updatedRole = await role.update({
        name,
    }, { transaction: extras.transaction, });

    await extras.transaction.commit();
    return res.sendRes(updatedRole, { message: 'Role updated successfully', status: STATUS_CODE.OK, });
});

const deleteById = routeHandler(async (req, res, extras) => {
    const { role_id } = req.params;

    const role = await Role.findOne({ where: { role_id } });
    if (!role) {
        return sendAppError(extras, 'Role not found', STATUS_CODE.NOT_FOUND);
    }

    await role.destroy({ transaction: extras.transaction }).then(async (result) => {
        await extras.transaction.commit();
        return res.sendRes(null, { message: 'Role deleted successfully', status: STATUS_CODE.OK });
    });
});

const updatePermissionsById = routeHandler(async (req, res, extras) => {
    const { role_id } = req.params;
    const { permissions } = req.body;

    if (isNull([permissions]) || permissions.length == 0) {
        return sendAppError(extras, NO_PARAMS, STATUS_CODE.BAD_REQUEST)
    }

    const role = await Role.findOne({ where: { role_id } });
    if (!role) {
        return sendAppError(extras, 'Role not found', STATUS_CODE.NOT_FOUND);
    }

    const newPermissions = await Permission.findAll({
        where: {
            permission_id: {
                [Op.in]: permissions,
            },
        },
    })

    await role.setPermissions(newPermissions, { transaction: extras.transaction, force: true, })
    await extras.transaction.commit();

    const updatedRole = await Role.findOne({
        where: {
            role_id,
        },
        include: [
            {
                model: Permission,
                as: 'permissions',
                paranoid: false,
                through: {
                    attributes: [],
                },
            },
        ],
    })

    return res.sendRes(updatedRole, { message: 'Role permissions updated successfully', status: STATUS_CODE.OK, });
});

module.exports = {
    create,
    getAll,
    getById,
    updateById,
    updatePermissionsById,
    deleteById,
};