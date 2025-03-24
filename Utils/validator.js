const { body, validationResult } = require('express-validator');
const constants = require('./constants');
const util = require('util');
const userController = require('../controllers/users');

const config = {
    password_config: {
        minLength: 8,
        minNumbers: 1,
        minSymbols: 1,
        minUppercase: 1,
        minLowercase: 1
    }
};

module.exports = {
    validators: [
        // Kiểm tra email
        body('email')
            .isEmail()
            .withMessage(constants.EMAIL_ERROR),

        // Kiểm tra password
        body('password')
            .isStrongPassword(config.password_config)
            .withMessage(
                util.format(
                    constants.PASSWORD_ERROR,
                    config.password_config.minLength,
                    config.password_config.minLowercase,
                    config.password_config.minUppercase,
                    config.password_config.minSymbols,
                    config.password_config.minNumbers
                )
            ),

        // Kiểm tra username
        body('username')
            .isAlphanumeric()
            .withMessage('Username chỉ được chứa chữ cái và số.'),

        // Kiểm tra role
        body('role')
            .isIn(constants.USER_PERMISSION)
            .withMessage('Role không hợp lệ.'),

        // ✅ Kiểm tra fullName: chỉ chứa ký tự chữ (bao gồm Unicode)
        body('fullName')
            .matches(/^[\p{L}\s]+$/u)
            .withMessage('fullName chỉ được chứa ký tự chữ.'),

        // ✅ Kiểm tra imgURL: phải là URL hợp lệ
        body('imgURL')
            .optional() // Không bắt buộc
            .isURL()
            .withMessage('imgURL phải là một URL hợp lệ.'),
    ],

    // Middleware kiểm tra lỗi
    validator_middleware: (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map((err) => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }
        next();
    },

    // ✅ Tạo 3 người dùng với mỗi vai trò
    seedUsers: async () => {
        try {
            const roles = ['user', 'mod', 'admin'];
            const users = roles.map(async (role, index) => {
                return await userController.createUser(
                    `user${index + 1}`,
                    'Password@123',
                    `user${index + 1}@example.com`,
                    role
                );
            });

            await Promise.all(users);
            console.log('🎉 Đã tạo 3 người dùng với các vai trò khác nhau.');
        } catch (error) {
            console.error('❌ Lỗi khi tạo người dùng:', error.message);
        }
    },
};
