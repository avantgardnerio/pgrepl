import express from 'express';

import { db } from '../services/DbService.mjs';

const router = express.Router();

router.get(`/`, async (req, res, next) => {
  const documents = await db.any('SELECT * FROM document');
  res.json(documents);
});

export default router;
