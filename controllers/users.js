/* eslint-disable prefer-destructuring */
/* eslint-disable no-multi-spaces */
/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../middlewares/errors/NotFoundError');
const BadRequest = require('../middlewares/errors/BadRequest');
const Conflict = require('../middlewares/errors/Conflict');

const { NODE_ENV, JWT_SECRET } = process.env;

// eslint-disable-next-line no-undef

module.exports.likeCard = (req, res, next) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { likedCards: req.params.id } }, // Добавляем идентификатор карточки в список понравившихся карточек пользователя
    { new: true },
  )

    .then((card) => {
      if (!card) {
        throw new NotFoundError('Карточка не найдена');
      }
      res.status(200).send({ data: card });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Переданы некорректные данные при лайке карточки.'));
      } else {
        next(err);
      }
    });
};

module.exports.dislikeCard = (req, res, next) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $pull: { likedCards: req.params.id } }, // Удаляем идентификатор карточки из списка понравившихся карточек пользователя
    { new: true },
  )

    .then((card) => {
      if (!card) {
        throw new NotFoundError('Карточка не найдена');
      }
      res.status(200).send({ data: card });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Переданы некорректные данные при дизлайке карточки.'));
      } else {
        next(err);
      }
    });
};

module.exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .then((users) => {
      if (!users) {
        next(new NotFoundError('Нет пользователя с таким id'));
      }
      return res.send({ data: users });
    })
    // eslint-disable-next-line no-unused-vars
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Переданы некорректные данные при получении пользователя.'));
      }
      next(err);
    });
};

module.exports.getInfoUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((users) => {
      if (!users) {
        next(new NotFoundError('Нет пользователя с таким id'));
      }
      return res.send({ data: users });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new BadRequest('Переданы некорректные данные при получении пользователя.'));
      }
      next(err);
    });
};


// eslint-disable-next-line no-undef
module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((Users) => res.send({ data: Users }))
    .catch(next);
};

module.exports.backUser = (req, res, next) => {
  if (!req.cookies.jwt) {
    next(res.status(401).send({ message: 'Необходима авторизация' }));
  }
  res.clearCookie('jwt').status(201).send({ message: 'Удачного дня))' });
};

// eslint-disable-next-line no-undef
module.exports.createUser = (req, res, next) => {
  const { login, password } = req.body;

  if (!password || !login) {
    next(new BadRequest('пароль или логин не указаны'));
  }

  User.findOne({ login })
    .then((user) => {
      if (user) {
        next(new Conflict('Пользователь уже создан'));
      }

      bcrypt.hash(password, 10)
        .then((hash) => {
          User.create({
            login,
            password: hash,
          })
            .then((user) => res.status(201).send(user))
            .catch((err) => {
              if (err.name === 'ValidationError') {
                next(new BadRequest('Переданы некорректные данные при получении пользователя.'));
              }
              next(err);
            });
        });
    });
};

module.exports.login = (req, res, next) => {
  const { login, password } = req.body;

  if (!login || !password) {
    next(new BadRequest('Логин или пароль не указаны'));
  }

  return User.findUserByCredentials(login, password, res, next)
    .then((user) => {
      if (user) {
        const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');

        res.cookie('jwt', token, {
          httpOnly: true,
          sameSite: 'None', // This is important for cross-site requests
          secure: true, // Ensure your site uses HTTPS
        })
          .status(200).send({ user: user.toJSON(), token });
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequest('Переданы некорректные данные при получении пользователя.'));
      }
      next(err);
    });
};
