import { Router } from "express";
import { body, validationResult } from "express-validator";
import { db } from "../index.js";
import authMiddleware from "../middleware/auth.js";
import * as admin from "firebase-admin";

const router = Router();

router.post(
  "/",
  authMiddleware,
  [
    body("solicitudId").notEmpty().withMessage("Campo 'solicitudId' es obligatorio"),
    body("conductor").notEmpty().withMessage("Campo 'conductor' es obligatorio"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { solicitudId, conductor } = req.body;

    try {
      const docRef = db.collection("viajes").doc();
      await docRef.set({
        solicitudId,
        conductor,
        estado: "activo",
        fechaInicio: admin.firestore.Timestamp.now(),
      });

      res.status(200).json({ ok: true, mensaje: "Viaje creado", idViaje: docRef.id });
    } catch (err) {
      next(err);
    }
  }
);

export default router;