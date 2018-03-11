import express from 'express';

const router = express.Router();

const users = [
  {id: 1, givenName: 'Alan', familyName: 'Turing'},
  {id: 1, givenName: 'Grace', familyName: 'Hopper'},
];

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.json(users);
});

export default router;
