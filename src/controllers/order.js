import prisma from "../prisma.js";

export const OrderController = {
  //C - CREATE, INSERT, POST, SET, STORE
  async store(req, res, next) {
    try {
      const { serviceId, clientId, equipment, defect, report, guarantee, status, dateDelivery, dateRecipt, dateCreate, products } = req.body;

      const error = {}

      let user = await prisma.user.findFirst({
        where: { id: Number(req.logado.id) }
      });

      if (!user) {
        error.user = { message: "error: Usuário informado não existe" }
      }

      let service = await prisma.service.findFirst({
        where: { id: Number(serviceId) },
      });

      if (!service) {
        error.service = { message: "error: Serviço informado não existe" };
      }

      let client = await prisma.client.findFirst({
        where: { id: Number(clientId) },
      });

      if (!client) {
        error.client = { message: "error: Cliente informado não existe" };
      }

      if (Object.keys(error).length > 0) {
        res.status(301).json(error);
        return;
      }

      const create = await prisma.order.create({
        data: {
          userId: Number(req.logado.id),
          serviceId: Number(serviceId),
          clientId: Number(clientId),
          equipment,
          defect,
          report,
          guarantee,
          status,
          dateCreate,
          dateDelivery,
          dateRecipt,

          shops: {
            create: products.map((p) => ({
              productId: Number(p.productId),
              amount: Number(p.amount),
              salePrice: p.salePrice
            }))
          }
        },
        include: {
          shops: {
            include: { product: true }
          },
          client: true,
          service: true
        }

      });
      // respondendo 201-criado encapsulando no formato json(order)
      res.status(201).json({message: "Ordem de Serviço criada com Sucesso!"})
    }
    catch (error) {
      next(error);
    }
  },
  //R - READ, SELECT, GET, findMany
  async index(req, res, next) {
    try {
      let query = {}

      // if (req.query.saleMax && req.query.saleMin) {
      //     query.salePrice = { gte: Number(req.query.saleMin), lte: Number(req.query.saleMax)}
      // }
      // else if (req.query.saleMax) {
      //     query.salePrice = {gte: Number(req.query.saleMin)}
      // }
      // else if (req.query.saleMin) {
      //     query.salePrice = {lte: Number(req.query.saleMax)}
      // }
      if (req.query.productPrice) {
        query.productPrice = req.query.productPrice;
      }

      const orders = await prisma.order.findMany({
        where: {
          ...query,
          userId: req.logado.id
        },
        include: {
          client: true,
          service: true,
          shops: {
            include: { product: true }
          }
        }
      });
      if (orders.length === 0) {
        return res.status(404).json({ message: "Nada encontrado" });
      } else {
        const ordersWithTotal = orders.map(order => {

          // Total de serviços
          let totalService = 0;
          if (Array.isArray(order.service)) {
            totalService = order.service.reduce(
              (acc, s) => acc + (Number(s.price) || 0),
              0
            );
          } else if (order.service) {
            totalService = Number(order.service.price) || 0;
          }

          // Total de produtos
          const totalProducts = (order.shops || []).reduce((acc, shop) => {
            const productPrice = Number(shop.product.salePrice) || 0;
            const quantity = Number(shop.amount) || 1;
            return acc + productPrice * quantity;
          }, 0);

          // Soma total geral
          const total = totalService + totalProducts;

          return {
            ...order,
            totalService,
            totalProducts,
            total,
          };
        });

        res.status(200).json(ordersWithTotal);

      }
    } catch (error) {
      console.error(error);

      next(error);
    }
  },
  //R - READ, SELECT, GET, find
  async show(req, res, _next) {
    try {
      const id = Number(req.params.id);

      let order = await prisma.order.findFirstOrThrow({
        where: { id, userId: req.logado.id },
        include: {
          client: true,
          service: true,
          shops: {
            include: { product: true }
          }
        }
      });

      res.status(200).json(order);
    } catch (err) {
      console.error(err);

      res.status(404).json({ error: "Erro interno ao buscar orders" });
    }
  },

  async del(req, res, _next) {
    try {
      const id = Number(req.params.id);

      let order = await prisma.order.delete({
        where: { id, userId: req.logado.id }
      });

      res.status(200).json(order);
    } catch (err) {
      res.status(404).json({ error: "Erro interno ao buscar orders" });
    }
  },

  async update(req, res, _next) {

    const id = Number(req.params.id);

    try {
      let body = {};

      if (req.body.clientId) {
        body.clientId = Number(req.body.clientId);
      }

      if (req.body.status) {
        body.status = req.body.status;
      }

      const date = await prisma.order.findUnique({
        where: { id },
        select: { dateCreate: true }
      });

      if (req.body.dateCreate !== date.dateCreate) {
        return res.status(404).json({ error: "Não é Possivel Alterar a Data de Criação da Ordem de Serviço" });
      }

      if (req.body.serviceId) {
        body.serviceId = Number(req.body.serviceId);
      }

      if (req.body.dateDelivery) {
        body.dateDelivery = req.body.dateDelivery;
      }

      if (req.body.equipment) {
        body.equipment = req.body.equipment;
      }

      if (req.body.defect) {
        body.defect = req.body.defect;
      }

      if (req.body.report) {
        body.report = req.body.report;
      }

      if (req.body.guarantee) {
        body.guarantee = req.body.guarantee;
      }

      const orderExists = await prisma.order.findFirst({
        where: { id, userId: req.logado.id },
      });

      if (!orderExists) {
        return res.status(404).json({ error: "Ordem d Serviço não encontrada" });
      }


      const updateOrder = await prisma.order.update({
        where: { id: orderExists.id },
        data: body,
      });


      res.status(200).json({ message: "Ordem Atualizada com Sucesso" });
    } catch (err) {
      console.error(err)
      res.status(404).json({ error: "Erro interno ao buscar orders" });
    }
  },
};
