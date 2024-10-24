const { DataTypes, Sequelize } = require("sequelize");

const defaultKeys = (name) => {
    return {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        [name]: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
    };
};


const migrationDefaults = (options = {
    paranoid: true,
}) => {
    const timestamps = {
        created_at: {
            type: 'TIMESTAMP',
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
            type: 'TIMESTAMP',
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
    };

    if (options.paranoid) {
        timestamps.deleted_at = {
            type: DataTypes.DATE,
            allowNull: true,
        }
    }
    return timestamps;
};

/**
 * 
 * @param {*} sequelize 
 * @param {*} tableName 
 * @param {import("sequelize").InitOptions} options 
 * @returns 
 */
const modelDefaults = (sequelize, tableName, options = {}) => {
    const defaultConfig = {
        paranoid: true,
    };

    const initConfig = {
        sequelize,
        tableName,
        createdAt: "created_at",
        updatedAt: "updated_at",
        ...defaultConfig,
        ...options,
    };

    if (initConfig.paranoid) {
        initConfig.deletedAt = 'deleted_at';
    }
    return initConfig;
};

const relationShip = ({ modelName, key, allowNull = false, unique = false, onDelete = "CASCADE", onUpdate = "CASCADE" }) => {
    return {
        type: DataTypes.STRING,
        allowNull: allowNull,
        onDelete: onDelete,
        onUpdate: onUpdate,
        references: {
            key: key,
            model: modelName,
        },
        unique: unique,
    };
};

module.exports = {
    defaultKeys,
    migrationDefaults,
    modelDefaults,
    relationShip,
};