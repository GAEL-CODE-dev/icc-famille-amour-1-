import { Router } from "express";
import rateLimit from "express-rate-limit";

import { loginSchema } from "../validators/authValidators.js";

import {
  authenticate,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} from "../services/authService.js";

import {
  signAccessToken,
  signRefreshToken,
  requireAuth,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  cookieOptions,
} from "../middlewares/auth.js";

const router = Router();


/**
 * =========================================================
 * LIMITATION LOGIN
 * =========================================================
 */

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message:
        "Trop de tentatives, réessayez plus tard.",
    },
  },
});


/**
 * =========================================================
 * LOGIN
 * =========================================================
 */

router.post(
  "/login",
  loginLimiter,
  async (req, res, next) => {

    try {

      const {
        email,
        password,
      } = loginSchema.parse(
        req.body
      );

      const admin =
        await authenticate({
          email,
          password,
          ip: req.ip,
        });


      res.cookie(
        ACCESS_COOKIE_NAME,
        signAccessToken(admin),
        cookieOptions(
          15 * 60_000
        )
      );


      res.cookie(
        REFRESH_COOKIE_NAME,
        signRefreshToken(admin),
        cookieOptions(
          7 *
          24 *
          60 *
          60_000
        )
      );


      res.json({
        admin: {
          id: admin.id,
          nom: admin.nom,
          email: admin.email,
          role: admin.role,
        },
      });

    } catch (err) {

      next(err);

    }

  }
);


/**
 * =========================================================
 * LOGOUT
 * =========================================================
 */

router.post(
  "/logout",
  (req, res) => {

    res.clearCookie(
      ACCESS_COOKIE_NAME,
      {
        path: "/",
      }
    );

    res.clearCookie(
      REFRESH_COOKIE_NAME,
      {
        path: "/",
      }
    );

    res.status(204).end();
  }
);


/**
 * =========================================================
 * MON PROFIL — CONSULTATION
 * =========================================================
 */

router.get(
  "/me",
  requireAuth,
  async (req, res, next) => {

    try {

      const admin =
        await getMyProfile(
          req.admin.id
        );

      res.json({
        success: true,
        admin,
      });

    } catch (err) {

      next(err);

    }

  }
);


/**
 * =========================================================
 * MON PROFIL — MODIFICATION
 * =========================================================
 */

router.put(
  "/me",
  requireAuth,
  async (req, res, next) => {

    try {

      const {
        nom,
        email,
      } = req.body;


      const admin =
        await updateMyProfile(
          req.admin.id,
          {
            nom,
            email,
          },
          req.ip
        );


      /*
       * Le JWT actuel contient l'ancien nom.
       *
       * On recrée donc les cookies avec les
       * informations actualisées.
       */

      res.cookie(
        ACCESS_COOKIE_NAME,
        signAccessToken(admin),
        cookieOptions(
          15 * 60_000
        )
      );


      res.json({
        success: true,
        message:
          "Profil modifié avec succès.",
        admin,
      });

    } catch (err) {

      next(err);

    }

  }
);


/**
 * =========================================================
 * MON PROFIL — CHANGEMENT MOT DE PASSE
 * =========================================================
 */

router.post(
  "/me/password",
  requireAuth,
  async (req, res, next) => {

    try {

      const {
        currentPassword,
        newPassword,
      } = req.body;


      await changeMyPassword(
        req.admin.id,
        {
          currentPassword,
          newPassword,
        },
        req.ip
      );


      /*
       * Pour une meilleure sécurité,
       * on renouvelle le token d'accès
       * après le changement de mot de passe.
       */

      const admin =
        await getMyProfile(
          req.admin.id
        );


      res.cookie(
        ACCESS_COOKIE_NAME,
        signAccessToken(admin),
        cookieOptions(
          15 * 60_000
        )
      );


      res.json({
        success: true,
        message:
          "Mot de passe modifié avec succès.",
      });

    } catch (err) {

      next(err);

    }

  }
);


export default router;
