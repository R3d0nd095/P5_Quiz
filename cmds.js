//Comandos
const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');

/*
 * Muestra la ayuda
 */
exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, "  h|help - Muestra esta ayuda.");
    log(socket, "  list - Listar los quizzes existentes.");
    log(socket, "  show <id> - Muestra la pregunta y la respuesta en el quiz indicado.");
    log(socket, "  add - Añadir un nuevo quiz interactivamente.");
    log(socket, "  delete <id> - Borrar el quiz indicado.");
    log(socket, "  edit <id> - Editar el quiz indicado.");
    log(socket, "  test <id> - Probar el quiz indicado.");
    log(socket, "  p|player - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "  credits - Créditos.");
    log(socket, "  q|quit - Salir del programa.");
    rl.prompt();
};
/**
 * Sale del juego
 *
 * @param rl Objeto readline usado par implementar el CLI.
 */
exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};
/**
 * Esta función convierte la llamda rl.question, que está basada en callbacks, en
 * una basada en promesas.
 *
 * Esta función devuelve una promesa que cuando se cumple, proporciona el texto introductorio
 * Entonces la llamada a then que hay que hacer la promesa devuelta sera:
 *      .then(answer => {...})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio y al final
 *
 * @param rl Objeto readline usado par implementar el CLI.
 * @param text texto a meter
 * @returns {Promise<any>}
 */
const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};
/**
 * Esta función añade un quiz
 *
 * @param rl Objeto readline usado par implementar el CLI.
 */
exports.addCmd = (socket, rl) => {
    makeQuestion(rl, ' Introduzca una pregunta: ')
    .then(q => {
        return makeQuestion (rl, ' Introduzca la respuesta: ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(socket, `  ${colorize('Se ha añadido: ', 'magenta')} ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erróneo: ');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
/*
 * Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd = (socket, rl) => {
    models.quiz.findAll()
        .each(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Esta función devuelve una promesa que:
 *  -Valida que se ha introducido un valor para el parámetro.
 *  - Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 * @param id Parámetro con el índice a validar.
 * @returns {Promise<any>}
 */
const validateId = (id) => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id ==="undefined"){
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
            id = parseInt(id); //coger la parte entera y descartar lo dema
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};

/*
 * Muestra un quiz indicado
 */
exports.showCmd = (socket, rl,id) =>{
    validateId(id)
    .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl Objeto readline usado par implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (socket, rl,id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(socket, colorize(`${quiz.question}?: `,'magenta' ));
        return makeQuestion(rl, ' Introduzca la respuesta: ' )
        .then(a => {
            switch(a.toLowerCase().trim()){
                case quiz.answer.toLowerCase().trim():
                    log(socket, 'Su respuesta es correcta.');
                    biglog(socket, 'Correcta','green');
                    break;
                default:
                    log(socket, 'Su respuesta es incorrecta.');
                    biglog(socket, 'Incorrecta','red');
                    break;
            }
        });

    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * se gana si se constesta a todos satisfactoriamente.
 *
 * @param rl Objeto readline usado par implementar el CLI.
 */
exports.playCmd = (socket, rl) => {
    let score = 0;
    let toBeResolved = [];

    const playOne = () => {

        return new Sequelize.Promise((resolve, reject) => {

            if (toBeResolved.length === 0){
                log(socket, 'No hay nada más que preguntar.','black');
                log(socket, `Fin del juego. Aciertos: ${score}`);
                biglog(socket, `${score}`, 'magenta');
                resolve();
                return;
            } else {
                let id = Math.floor(Math.random() * toBeResolved.length);
                let quiz = toBeResolved[id];
                toBeResolved.splice(id, 1);

                log(socket, colorize(`${quiz.question}?: `,'magenta' ));
                return makeQuestion(rl, ' Introduzca la respuesta: ' )
                    .then(a => {
                        switch(a.toLowerCase().trim()){
                            case quiz.answer.toLowerCase().trim():
                                score++;
                                log(socket, `CORRECTO - Lleva ${score} aciertos.`,'black');
                                resolve(playOne());
                                break;
                            default:
                                log(socket, `INCORRECTO.`, 'black');
                                log(socket, `Fin del juego. Aciertos: ${score}`);
                                biglog(socket, `${score}`,'magenta');
                                resolve();
                                break;
                        }
                    });
            }

        })
    }

    models.quiz.findAll({raw: true})
    .then(quizzes => {
        toBeResolved = quizzes;
    })
    .then(() => {
        return playOne();
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    })
};

/**
 * Borra un quiz del modelo.
 *
 * @param rl Objeto readline usado par implementar el CLI.
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (socket, rl,id) => {

    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
/**
 * Edita un quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El promt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.promt() se debe hacer en la callback de la segunda
 * llamada al rl.question.
 *
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (socket, rl,id) => {
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
            throw new Error(`No existe un quiz asociado al id= ${id}.`);
        }

        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
        return makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
            return makeQuestion(rl, ' Introduzca la respuesta: ' )
            .then(a => {
                quiz.question = q;
                quiz.answer = a;
                return quiz;
            });
        });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(socket, `  Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'Elquiz es erróneo: ');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};
/**
 * Nombres del autor
 *
 * @param rl Objeto readline usado par implementar el CLI.
 */
exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autor de la práctica:');
    log(socket, 'Miguel Redondo Casado', 'green');
    rl.prompt();
};