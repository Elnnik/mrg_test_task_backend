require('dotenv').config()
const jwt = require('jsonwebtoken')
const {Token} = require('../model')
const {User} = require('../model')

async function newAccessTokenCreating(refreshToken) {
    const refreshTokenObj = await Token.findOne({token: refreshToken})
    const userId = refreshTokenObj.user
    const user = await User.findOne({_id: userId})

    return await user.createAccessToken()
}


async function checkAccessJWTSign (req, res, next) {
    console.log('Check accessJWT')
    const {cookies: {accessToken, refreshToken}} = req

    console.log('MIDDLEWARE ACCESS TOKEN', accessToken)

    if (accessToken) {

        try {
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_PUBLIC_KEY, {algorithm: 'RS256'})
            console.log('VERIFIED SUCCESSFUL')
            return next()

        } catch (error) {
            if (error.message === 'jwt expired') {
                if ( !refreshToken ) return res.status(403).json({'refreshTokenError': 'Ошибка доступа, отсутствует Refresh Token'})

                const newAccessToken = await newAccessTokenCreating(refreshToken)
                res.locals.newAccessToken = newAccessToken
                return next()
            }
            else {
                return res.status(403).json({'accessTokenError': 'Access Token недействителен'})
            }
        }
    }

    return res.sendStatus(403)
}


async function checkRefreshJWTSign (req, res, next) {
    console.log('check refreshJWT')
    const { cookies: {refreshToken} } = req

    if (refreshToken) {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PUBLIC_KEY, {algorithm: 'RS256'}, async (error) => {
            if (error) {
                return res.redirect('http://localhost:8000/login')
            }
        })
        return next()
    } else return res.sendStatus(403)
}


module.exports = { checkAccessJWTSign, checkRefreshJWTSign }