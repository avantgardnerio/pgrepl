import express from 'express';

import { db } from '../services/DbService.mjs';

const router = express.Router();

router.get(`/documents`, async (req, res, next) => {
  const documents = await db.any('SELECT * FROM document');
  res.json(documents);
});

router.post(`/documents`, async (req, res, next) => {
  const doc = req.body;
  console.log('inserting', doc)
  await db.none('insert into document (id, name, "curTxnId") values ($1, $2, $3)',
    [doc.id, doc.name, doc.curTxnId]
  );
  res.json(true);
});

export default router;
