import prisma from '../prisma.js';
import { connectUserToGroup } from '../../prisma/seed.js';
import axios from 'axios';
export const SignatureController = {
  async store(req, res, next) {
    try {

      const { type, isActive } = req.body;

      let user = await prisma.user.findFirst({
        where: { id: Number(req.logado.id) }
      });

      if (!user) {
        res.status(301).json({ 'error': "Usuario informado Não existe" })
      }

      const signature = await prisma.signature.create({
        data: {
          type,
          isActive: Boolean(isActive),
          userId: Number(req.logado.id)
        }
      });

      const premium = await prisma.group.findFirst({
        where: { name: "Premium" }
      });

      const free = await prisma.group.findFirst({
        where: { name: "Free" }
      });

      if (type === "Premium") {
        await connectUserToGroup({ userId: Number(req.logado.id), groupId: premium.id });
      }

      else if (type === "Free") {
        await connectUserToGroup({ userId: Number(req.logado.id), groupId: free.id });
      };


      res.status(201).json(signature);
    } catch (error) {
      next(error);
    }
  },

  async index(req, res, next) {
    try {
      let query = {};

      if (req.query.type) {
        query.type = req.query.type;
      }

      if (req.query.isActive) {
        query.isActive = Boolean(req.query.isActive);
      }

      const signature = await prisma.signature.findMany({
        where: query,
      });

      if (signature.length == 0) {
        res.status(404).json("Não encontrado");
      } else {
        res.status(200).json(signature);
      }
    } catch (error) {
      next(error);
    }
  },

  async show(req, res, _next) {
    try {
      const id = Number(req.params.id);

      let signature = await prisma.signature.findFirstOrThrow({
        where: { id },
      });

      res.status(200).json(signature);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  async del(req, res, _next) {
    try {
      const id = Number(req.params.id);

      let signature = await prisma.signature.delete({ where: { id } });

      res.status(200).json(signature);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  async update(req, res, _next) {
    try {
      let body = {};

      if (req.body.type) {
        body.type = req.body.type;
      }

      if (req.body.isActive) {
        body.isActive = Boolean(req.body.isActive);
      }

      const id = Number(req.params.id);

      const signatureUpdate = await prisma.signature.update({
        where: { id },
        data: body,
      });

      res.status(200).json(signatureUpdate);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  // Plano Mercado Pago
  async planmp(req, res, _next) {
    try {
      const body = {
        reason: "Assinatura Premium OS Control",

        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          billing_day: 5,
          billing_day_proportional: false,
          transaction_amount: 10,
          currency_id: "BRL"
        },

        free_trial: {
          frequency: 7,
          frequency_type: "days"
        },

        payment_methods_allowed: {
          payment_types: [
            { id: "credit_card" }
          ]
        },

        back_url: "https://ordemservico-sigma.vercel.app/"
      };

      const response = await axios.post(
        "https://api.mercadopago.com/preapproval_plan",
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer TEST-7660118400167569-122319-73cf46ca0f4f0feffad26c4c2654941d-2151418961`
          }
        }
      );


      res.status(200).json(response.data);
    } catch (err) {
      res.status(404).json(console.log(err));
    }
  },

  // Assinatura Mercado Pago
  async assinatura(req, res, _next) {
    try {
      const body = {

        preapproval_plan_id: "1decf58a8125483ea32290ab0bc357b6",
        reason: "Assinatura Premium OS Control",
        payer_email: "Muil0@yahoo.com",
        card_token_id: e3ed6f098462036dd2cbabe314b9de2a,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          start_date: "2020-06-02T13:07:14.260Z",
          end_dat: "2022-07-20T15:59:52.581Z",
          transaction_amount: 10,
          currency_id: "BRL"
        },

        back_url: "https://ordemservico-sigma.vercel.app/",
        status: "authorized"

      };

      const response = await axios.post(
        "https://api.mercadopago.com/preapproval",
        body,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer TEST-7660118400167569-122319-73cf46ca0f4f0feffad26c4c2654941d-2151418961`
          }
        }
      );


      res.status(200).json(response.data);
    } catch (err) {
      res.status(404).json(console.log(err));
    }
  }
};
