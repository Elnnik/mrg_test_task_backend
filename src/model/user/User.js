require('dotenv').config()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const Token = require('../authentication/Token')


const userSchema = new mongoose.Schema({
    firstName: {type: String, required: true, min: 6, max: 30},
    lastName: {type: String, required: true, min: 6, max: 30},
    login: {type: String, required: true, unique: true, min: 6, max: 30},
    email: {type: String, required: true, max: 50},
    password: {type: String, required: true, min: 8, max: 1024},
    date: {type: Date, default: Date.now}
})

userSchema.methods = {
    createAccessToken: async function() {
        try {
            const _id = this._id
            return jwt.sign({userId: _id}, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
                algorithm: 'RS256',
                expiresIn: '5m'
            })
        } catch (error) {
            console.log(error)
            return
        }
    },

    createRefreshToken: async function() {
        try {
            const _id = this._id;
            const refreshToken = jwt.sign({userId: _id}, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
                algorithm: 'RS256',
                expiresIn: '30d'
            })

            await Token.create({token: refreshToken, user: _id})
            return refreshToken
        } catch (error) {
            console.error(error)
            return
        }
    }
}
module.exports = {userSchema: userSchema, User: mongoose.model('User', userSchema)}

