import { Router } from "express";
import { db } from "../index.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const snapshot = await db.collection("solicitudes_viaje").orderBy("fechaCreacion", "desc").get();
    const solicitudes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ ok: true, solicitudes });
  } catch (err) {
    next(err);
  }
});

export default router;