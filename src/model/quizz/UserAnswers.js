const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
require('dotenv').config()


const userAnswerSchema = new mongoose.Schema({
    _id: {type: mongoose.Schema.Types.ObjectId, required: true},
    // answer: {type: String, min: 2, max: 200, required: true}
})

const userAnswersToQuestionsSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true},
    answers: {type: [userAnswerSchema], validate: v => Array.isArray(v) && v.length > 0}
})

const userAnswerToQuizzSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    quizzId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Quizz"},
    questions: { type: [userAnswersToQuestionsSchema]},
    result: {type: Number, default: 0},
    mark: {type: Number, default: 0},
    isInit: {type: Boolean, default: true}
}, {timestamps: true})


userAnswerToQuizzSchema.methods = {
    createInitUserAnswerToQuizzToken: async function () {
        try {
            const _id = this._id
            return jwt.sign({initUserAnswerToQuizzId: _id}, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
                algorithm: 'RS256',
                expiresIn: '10m'
            })
        } catch (error) {
            console.log(error)
            return
        }
    }
}

module.exports = {userAnswerToQuizz: mongoose.model('userAnswerToQuizz', userAnswerToQuizzSchema)}