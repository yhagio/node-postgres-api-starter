const bcrypt = require('bcrypt');

const User = require('../../../models').User;
const signToken = require('../../auth/auth').signToken;
const validatePassword = require('../../utils/helpers').validatePassword;
const validateEmail = require('../../utils/helpers').validateEmail;
const generatePassword = require('../../utils/helpers').generatePassword;

module.exports = {
  saveUser,
  getUser,
};

// Register new user
function saveUser(req, res) {
  const username = req.body.username ? req.body.username.trim() : '';
  const email = req.body.email ? req.body.email.trim() : '';
  const password = req.body.password ? req.body.password.trim() : '';

  if (!username || !email || !password) {
    return res
      .status(422)
      .send({ error: 'Username, email, and password are required.' });
  }

  if (username.length > 30) {
    return res
      .status(400)
      .send({ error: 'Username must be less than 30 characters.' });
  }

  const emailValidationError = validateEmail(email);
  if (emailValidationError.length > 0) {
    return res
      .status(400)
      .send({ error: emailValidationError }); // array of errors
  }

  const passwordValidationError = validatePassword(password);
  if (passwordValidationError.length > 0) {
    return res
      .status(400)
      .send({ error: passwordValidationError });
  }

  // Check if email already exists
  User.findAll({
    where: { email },
  })
    .then((user) => {
      if (user.length > 0) {
        return res
        .status(400)
        .send({ error: 'The email is already registered.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const newUser = {
        username,
        email,
        password: hash,
      };

      User.create(newUser)
        .then((data) => {
          return res.json({
            token: signToken(data.id),
            user: {
              id: data.id,
              username: data.username,
              email: data.email,
            },
          });
        })
        .catch(err => res.status(400).send({ error: err.message }));
    })
    .catch(err => res.status(400).send({ error: err.message }));
}

// Get one user
function getUser(req, res) {
  User.findById(req.params.id)
    .then((user) => {
      if (!user || user.email.length <= 0) {
        return res.status(400).send({ error: 'No user found' });
      }
      return res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    })
    .catch(err => res.status(400).send({ error: err.message }));
}
