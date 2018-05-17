const express = require('express');
const router = express.Router();
const Sequelize = require('sequelize');
const sequelize = require('../models/index');
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'P5_Quiz' });
});

router.get('/credits', function(req, res, next) {
    res.render('credits', { title: 'Créditos' });
});
router.get('/quizzes', function(req, res, next) {

    sequelize.models.quiz.findAll()
        .then(quizzes => {
        res.render('quizzes', {quizzes});
})
.catch(error =>{
        next(error);
});
});
router.get('/index', function(req, res, next) {
    res.render('index', { title: 'Créditos' });
});
module.exports = router;