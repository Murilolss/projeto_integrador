import prisma from '../prisma.js';
import { connectUserToGroup } from '../../prisma/seed.js';

export const SignatureController = {
    async store(req, res, next) {
        try {

            const { type, isActive} = req.body;

            let user = await prisma.user.findFirst({
                where: {id: Number(req.logado.id)}
                });
                
                if (!user){
                res.status(301).json({'error': "Usuario informado Não existe"})
                }

            const signature = await prisma.signature.create({
                data: {
                    type,
                    isActive: Boolean(isActive),
                    userId: Number(req.logado.id)
                }
            });

            const premium = await prisma.group.findFirst({
                where: {name: "Premium"}
            });

            const free = await prisma.group.findFirst({
                where: {name: "Free"}
            });

            if (type === "Premium"){
                await connectUserToGroup({ userId: Number(req.logado.id), groupId: premium.id });
            }

            else if (type === "Free"){
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
};
