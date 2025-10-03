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
    body("viajeId").notEmpty().withMessage("Campo 'viajeId' es obligatorio"),
    body("monto").isNumeric().withMessage("Campo 'monto' debe ser numérico"),
    body("metodo").notEmpty().withMessage("Campo 'metodo' es obligatorio"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { viajeId, monto, metodo } = req.body;

    try {
      const docRef = db.collection("pagos").doc();
      await docRef.set({
        viajeId,
        monto,
        metodo,
        fecha: admin.firestore.Timestamp.now(),
      });

      res.status(200).json({ ok: true, mensaje: "Pago registrado", idPago: docRef.id });
    } catch (err) {
      next(err);
    }
  }
);

export default router;