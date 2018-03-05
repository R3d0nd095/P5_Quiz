//Comandos

const model = require('./model');

const {log, biglog, errorlog, colorize} = require("./out");
/*
 Muestra la ayuda
 */
exports.helpCmd = rl => {
    log("Comandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta en el quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|player - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};

exports.quitCmd = rl => {
    rl.close();
    rl.prompt();
};

exports.addCmd = rl => {

    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
            model.add(question, answer);
            log(`  ${colorize('Se ha añadido: ', 'magenta')} ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};
/*
 Lista todos los quizzes existentes en el modelo.
 */
exports.listCmd = rl => {

    model.getAll().forEach((quiz, id) => {

        log(`  [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });

    rl.prompt();
};

exports.showCmd = (rl,id) =>{

    if(typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(`  [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error) {
            errorlog(error.message);
        }
    }

    rl.prompt();
};

exports.testCmd = (rl,id) => {

    if (typeof id === "undefined"){
        errorlog('Falta el parámetro id.');
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(colorize(`${quiz.question}?: `,'magenta'), resp => {
                resp = resp.toLowerCase().trim();
                switch(resp){
                    case quiz.answer.toLowerCase().trim():
                        log('Su respuesta es correcta.');
                        biglog('Correcta','green');
                        break;
                    default:
                        log('Su respuesta es incorrecta.');
                        biglog('Incorrecta','red');
                        break;
                }
                rl.prompt();
            });
        } catch(error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
    rl.prompt();
};

exports.playCmd = rl => {

    let score = 0;
    let toBeResolved = [];

    for(let i = 0; i < model.count(); i++)
        toBeResolved[i] = i;

    const playOne = () => {

        if (toBeResolved.length === 0){
            log('No hay nada más que preguntar.','black');
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(`${score}`, 'magenta');
            rl.prompt();
        } else {
            let id = Math.floor(Math.random() * toBeResolved.length);
            let quiz = model.getByIndex(toBeResolved[id]);
            toBeResolved.splice(id, 1);

            rl.question(colorize(`${quiz.question}?: `,'magenta'), resp => {
                resp = resp.toLowerCase().trim();
                switch(resp) {
                    case quiz.answer.toLowerCase().trim():
                        score++;
                        log(`CORRECTO - Lleva ${score} aciertos.`,'black');
                        playOne();
                        break;

                    default:
                        log(`INCORRECTO.`, 'black');
                        log(`Fin del juego. Aciertos: ${score}`);
                        biglog(`${score}`,'magenta');
                        break;
                }
                rl.prompt();}
            );
        }
    };
    playOne();
    rl.prompt();
};

exports.deleteCmd = (rl,id) => {

    if(typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        }catch(error){
            errorlog(error.message);
        }
    }

    rl.prompt();
};

exports.editCmd = (rl,id) => {

    if(typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(`  Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        }catch(error){
            errorlog(error.message);
            rl.prompt();
        }
    }
    rl.prompt();
};

exports.creditsCmd = rl => {
    log('Autor de la práctica:');
    log('Miguel Redondo Casado', 'green');
    rl.prompt();
};
