const router = require('express').Router()
const { quizz } = require('../controllers')
const {checkAccessJWTSign, checkRefreshJWTSign} = require('../middlewares/jwtCheck.middleware')


router.get('/result', quizz.getQuizzResult)
router.get('/:id', checkAccessJWTSign, checkRefreshJWTSign, quizz.getQuizz)
// router.route('/create').post(quizz.createQuizz)
router.post('/:id', quizz.sendQuizzAnswers)


module.exports = router;