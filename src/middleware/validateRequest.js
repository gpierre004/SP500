import Joi from 'joi';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

export const schemas = {
  userRegister: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    email: Joi.string().email().required()
  }),
  userLogin: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().required()
  }),
  transaction: Joi.object({
    ticker: Joi.string().required(),
    purchase_date: Joi.date().iso().required(),
    quantity: Joi.number().integer().min(1).required(),
    type: Joi.string().valid('buy', 'sell').required(),
    comment: Joi.string().allow('', null),
    purchase_price: Joi.number().precision(2).positive().required(),
    portfolio_id: Joi.number().integer().positive().required(),
    current_price: Joi.number().precision(2).positive().required()
  })
};