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
    body("motivo").notEmpty().withMessage("Campo 'motivo' es obligatorio"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { solicitudId, motivo } = req.body;

    try {
      const docRef = db.collection("solicitudes_viaje").doc(solicitudId);
      await docRef.update({
        estado: "cancelado",
        motivoCancelacion: motivo,
        fechaCancelacion: admin.firestore.Timestamp.now(),
      });

      res.status(200).json({ ok: true, mensaje: "Servicio cancelado con éxito" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;