const Token = require('./authentication/Token')
const {userSchema, User} = require('./user/User')
const {answerSchema, Answer} = require('./quizz/Answer')
const {questionSchema, Question} = require('./quizz/Question')
const {quizzSchema, Quizz} = require('./quizz/Quizz')
const { userAnswerToQuizz } = require('./quizz/UserAnswers')

module.exports = {
    Token,
    userSchema, User,
    answerSchema, Answer,
    questionSchema, Question,
    quizzSchema, Quizz,
    userAnswerToQuizz
}
