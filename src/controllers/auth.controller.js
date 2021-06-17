require('dotenv').config()

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cookie = require('cookie')

const {User} = require('../model')
const { Token } = require('../model')


async function signup({body: {firstName, lastName, login, email, password, passwordConfirmation}}, res) {
    try {
        const isEmailExists = await User.findOne({email: email})
        const isLoginExists = await User.findOne({login: login})

        if (isEmailExists) return res.status(403).json({"error": "Данный email уже занят"})
        if (isLoginExists) return res.status(403).json({"error": "Данный логин уже занят"})
        if (password !== passwordConfirmation) return res.status(403).json({'error': 'Пароли не совпадают'})

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const createdUser = await User.create({firstName, lastName, login, email, password: hashedPassword})
        const accessToken = await createdUser.createAccessToken()
        const refreshToken = await createdUser.createRefreshToken()

        return res
            .cookie('accessToken', accessToken, {httpOnly: true, sameSite: "strict"})
            .cookie('refreshToken', refreshToken, {httpOnly: true, sameSite: "strict"})
            .status(200).json({"createdUser": createdUser})
    } catch (error) {
        return res.status(403).json({"error": "Ошибка регистрации", "details": error})
    }
}

async function login({body: {email, password}}, res) {
    try {
        const existingUser = await User.findOne({email: email})
        if ( !existingUser ) return res.status(403).send('Неправильный email или пароль! 1')

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)
        if ( !isPasswordCorrect ) return res.status(403).send('Неправильный email или пароль! 2')

        const accessToken = await existingUser.createAccessToken()
        const refreshToken = await existingUser.createRefreshToken()

        const isRefreshTokenExists = await Token.findOne({user: existingUser._id})
        if ( isRefreshTokenExists ) {
            await Token.findByIdAndUpdate(isRefreshTokenExists._id, {token: refreshToken})
        } else {
            await Token.create({token: refreshToken, user: existingUser._id})
        }

        return res
            .cookie('accessToken', accessToken, {httpOnly: true, sameSite: "strict"})
            .cookie('refreshToken', refreshToken, {httpOnly: true, sameSite: "strict"})
            .status(200).json({'loginUser': existingUser.login})
    } catch (error) {
        return res.status(403).json({"error": error})
    }
}

async function logout({cookies: {accessToken, refreshToken}}, res) {
    try {
        if ( !refreshToken || !accessToken ) return res.status(403).json({'message': 'Неавторизованный пользователь'})

        const isRefreshTokenInDatabase = await Token.findOne({token: refreshToken})
        if (isRefreshTokenInDatabase) {
            await Token.deleteOne(isRefreshTokenInDatabase)
            return res
                .clearCookie('accessToken')
                .clearCookie('refreshToken')
                .status(200).json({'message': 'Выход из системы прошел успешно'})
        }
    } catch (error) {
        return res.status(403).json({'error': error})
    }

    return res.status(403).json({'message': 'Неавторизованный пользователь'})

}

module.exports = {signup, login, logout}