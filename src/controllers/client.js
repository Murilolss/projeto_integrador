import prisma from "../prisma.js";

export const ClientController = {
  async store(req, res, next) {
    try {
      const { name, lastName, companyName, corporateReason, document, cep, phone, email, address, number, neighborhood, state, city } = req.body;

      // Validação de Campo Vazio
      function campoVazio(campo) {
        // Se for null, undefined ou vazio
        if (campo === null || campo === undefined) {
          return true;
        }

        // Se for string, verifica se tem texto (ignora espaços)
        if (typeof campo === "string") {
          return campo.trim().length === 0;
        }

        // Se for número, verifica se é NaN ou se é igual a 0 (caso queira considerar 0 como "vazio")
        if (typeof campo === "number") {
          return isNaN(campo);
        }

        // Se for qualquer outro tipo (ex: objeto, array), considera "não vazio"
        return false;
      }

      // Verificação de CPF/CNPJ Valido
      function validaCpfCnpj(documento) {
        const doc = String(documento).replace(/[^\d]/g, "");

        if (doc.length === 11) {
          if (/^(\d)\1{10}$/.test(doc)) return false;

          let soma = 0;

          for (let i = 1; i <= 9; i++) {
            soma += parseInt(doc.substring(i - 1, i)) * (11 - i);
          }
          let resto = (soma * 10) % 11;
          if (resto === 10 || resto === 11) resto = 0;
          if (resto !== parseInt(doc.substring(9, 10))) return false;

          soma = 0;
          for (let i = 1; i <= 10; i++) {
            soma += parseInt(doc.substring(i - 1, i)) * (12 - i);
          }
          resto = (soma * 10) % 11;
          if (resto === 10 || resto === 11) resto = 0;
          return resto === parseInt(doc.substring(10, 11));
        }

        if (doc.length === 14) {
          const b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
          if (/^(\d)\1{13}$/.test(doc)) return false;

          let n = 0;
          for (let i = 0; i < 12; i++) {
            n += doc[i] * b[i + 1];
          }
          if (doc[12] != (n % 11 < 2 ? 0 : 11 - (n % 11))) return false;

          n = 0;
          for (let i = 0; i <= 12; i++) {
            n += doc[i] * b[i];
          }
          return doc[13] == (n % 11 < 2 ? 0 : 11 - (n % 11));
        }

        return false;
      }

      // Verificação de Email Valido
      function validaemail() {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }


      const isPF = document.length === 14;
      const isPJ = document.length === 18;


      if (isPF) {
        if (campoVazio(name)) return res.status(400).json({ error: "Preencha o campo Nome" });
        if (campoVazio(lastName)) return res.status(400).json({ error: "Preencha o campo Sobrenome" });
      }


      if (isPJ) {
        if (campoVazio(companyName)) return res.status(400).json({ error: "Preencha o campo Nome da Empresa" });
        if (campoVazio(corporateReason)) return res.status(400).json({ error: "Preencha o campo Razão Social" });
      }


      if (campoVazio(document)) {
        return res.status(400).json({ error: "Preencha o campo CPF ou CNPJ" });
      }

      //validação de CPF ou CNPJ existente
      const documentt = await prisma.client.findFirst({
        where: { document }
      })

      if (documentt) {

        if (document.length === 14) {
          return res.status(409).json({ error: "Já existe um Cliente Cadastrado com esse CPF" });
        }
        else if (document.length === 18) {
          return res.status(409).json({ error: "Já existe um Cliente Cadastrado com esse CNPJ" });
        }
      }


      if (!validaCpfCnpj(document)) {
        return res.status(422).json({ error: "CNPJ ou CPF inválido" });
      }

      if (campoVazio(cep)) {
        return res.status(400).json({ error: "Preencha o campo CEP" });
      }

      if (campoVazio(address)) {
        return res.status(400).json({ error: "Preencha o campo Endereço" });
      }

      if (campoVazio(number)) {
        return res.status(400).json({ error: "Preencha o campo Número" });
      }

      if (campoVazio(neighborhood)) {
        return res.status(400).json({ error: "Preencha o campo Bairro" });

      }
      if (campoVazio(state)) {
        return res.status(400).json({ error: "Preencha o campo Estado" });
      }

      if (campoVazio(city)) {
        return res.status(400).json({ error: "Preencha o campo Cidade" });
      }

      if (campoVazio(phone)) {
        return res.status(400).json({ error: "Preencha o campo Telefone" });
      }

      //validação de CPF ou CNPJ existente
      const phonee = await prisma.client.findFirst({
        where: { phone }
      })

      if (phonee) {
        return res.status(422).json({ error: "Já existe umm Cliente Cadastrado com esse Telefone" });
      }

      if (campoVazio(email)) {
        return res.status(400).json({ error: "Preencha o campo Email" });
      }

      if (!validaemail(email)) {
        return res.status(422).json({ error: "Email Inválido" });
      }

      // Validação de email existente
      let emaill = await prisma.client.findFirst({
        where: { email }
      });

      if (emaill) {
        return res.status(409).json({ error: "Já existe um Cliente cadastrado com esse Email" });
      }

      let user = await prisma.user.findFirst({
        where: { id: Number(req.logado.id) }
      });

      if (!user) {
        res.status(301).json({ error: "O Usuário Precisa estar Logado Para Editar um Serviço" });
        return
      }

      const client = await prisma.client.create({
        data: {
          name: isPF ? name : null,
          lastName: isPF ? lastName : null,
          companyName: isPJ ? companyName : null,
          corporateReason: isPJ ? corporateReason : null,
          document,
          cep,
          phone,
          email,
          address,
          number: Number(number),
          neighborhood,
          state,
          city,
          userId: Number(req.logado.id)
        }

      });

      return res.status(201).json({ message: "Cliente Cadastrado com Sucesso!" });
    } catch (err) {
      next(err);
    }
  },

  async index(req, res, next) {
    try {
      let query = {};

      if (req.query.name) {
        query.name = { contains: req.query.name };
      }

      if (req.query.document) {
        query.document = req.query.document;
      }

      if (req.query.cep) {
        query.cep = req.query.cep;
      }

      if (req.query.phone) {
        query.phone = req.query.phone;
      }

      if (req.query.email) {
        query.email = req.query.email;
      }

      if (req.query.address) {
        query.address = req.query.address;
      }

      if (req.query.number) {
        query.number = req.query.number;
      }

      if (req.query.neighborhood) {
        query.neighborhood = req.query.neighborhood;
      }

      if (req.query.state) {
        query.state = req.query.state;
      }

      if (req.query.city) {
        query.city = req.query.city;
      }


      const clients = await prisma.client.findMany({
        where: {
          ...query,
          userId: req.logado.id
        }
      });

      if (clients.length == 0) {
        res.status(404).json({ error: "Nenhum Cliente Encontrado" });
      } else {
        res.status(200).json(clients);
      }
    } catch (err) {
      next(err);
    }
  },

  async show(req, res, next) {
    try {
      const id = Number(req.params.id);

      let client = await prisma.client.findFirstOrThrow({ where: { id, userId: req.logado.id } });

      res.status(200).json(client);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  async del(req, res, _next) {
    try {
      const id = Number(req.params.id);

      const clientExists = await prisma.client.findFirst({
        where: { id, userId: req.logado.id },
      });

      if (!clientExists) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      const order = await prisma.order.findFirst({
        where: { clientId: id },
      });

      if (order) {
        return res.status(400).json({
          error: "Não é possível deletar o Cliente, pois ele está associado a uma ordem de serviço.",
        });
      }

      const client = await prisma.client.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Cliente Deletado com Sucesso!" });
    } catch (err) {
      return res.status(404).json({ error: "Erro ao Deletar Cliente" });
    }
  },

  async update(req, res, _next) {
    try {
      let body = {};


      if (req.body.name) {
        body.name = req.body.name;
      }

      if (req.body.lastName) {
        body.lastName = req.body.lastName;
      }

      if (req.body.companyName) {
        body.companyName = req.body.companyName;
      }

      if (req.body.corporateReason) {
        body.corporateReason = req.body.corporateReason;
      }

      if (req.body.document) {
        body.document = req.body.document;
      }

      if (req.body.cep) {
        body.cep = req.body.cep;
      }

      if (req.body.phone) {
        body.phone = req.body.phone;
      }

      if (req.body.email) {
        body.email = req.body.email;
      }

      if (req.body.address) {
        body.address = req.body.address;
      }

      if (req.body.number) {
        body.number = Number(req.body.number);
      }

      if (req.body.neighborhood) {
        body.neighborhood = req.body.neighborhood;
      }

      if (req.body.state) {
        body.state = req.body.state;
      }

      if (req.body.city) {
        body.city = req.body.city;
      }


      // Validação Para Campo Vazio
      function campoVazio(campo) {
        // Se for null, undefined ou vazio
        if (campo === null || campo === undefined) {
          return true;
        }

        // Se for string, verifica se tem texto (ignora espaços)
        if (typeof campo === "string") {
          return campo.trim().length === 0;
        }

        // Se for número, verifica se é NaN ou se é igual a 0 (caso queira considerar 0 como "vazio")
        if (typeof campo === "number") {
          return isNaN(campo);
        }

        // Se for qualquer outro tipo (ex: objeto, array), considera "não vazio"
        return false;
      }

      // Validação de Email
      function validaemail() {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(body.email);
      }

      
      if (campoVazio(body.document)) {
        return res.status(400).json({ error: "Preencha o campo CPF ou CNPJ" });
      }

      //validação de CPF ou CNPJ existente
      const document = await prisma.client.findFirst({
        where: { document: body.document, NOT: { id: Number(req.params.id) } }
      })

      if (document) {

        if (body.document.length === 14) {
          return res.status(409).json({ error: "Já existe um Cliente Cadastrado com esse CPF" });
        }
        else if (body.document.length === 18) {
          return res.status(409).json({ error: "Já existe um Cliente Cadastrado com esse CNPJ" });
        }
      }

      const isPF = body.document.length === 14;
      const isPJ = body.document.length === 18;


      if (isPF) {
        if (campoVazio(body.name)) return res.status(400).json({ error: "Preencha o campo Nome" });
        if (campoVazio(body.lastName)) return res.status(400).json({ error: "Preencha o campo Sobrenome" });
      }


      if (isPJ) {
        if (campoVazio(body.companyName)) return res.status(400).json({ error: "Preencha o campo Nome da Empresa" });
        if (campoVazio(body.corporateReason)) return res.status(400).json({ error: "Preencha o campo Razão Social" });
      }

      if (campoVazio(body.cep)) {
        return res.status(400).json({ error: "Preencha o campo CEP" });
      }


      if (campoVazio(body.address)) {
        return res.status(400).json({ error: "Preencha o campo Endereço" });
      }

      if (campoVazio(body.number)) {
        return res.status(400).json({ error: "Preencha o campo Número" });
      }

      if (campoVazio(body.neighborhood)) {
        return res.status(400).json({ error: "Preencha o campo Bairro" });

      }
      if (campoVazio(body.state)) {
        return res.status(400).json({ error: "Preencha o campo Estado" });
      }

      if (campoVazio(body.city)) {
        return res.status(400).json({ error: "Preencha o campo Cidade" });
      }

      if (campoVazio(body.phone)) {
        return res.status(400).json({ error: "Preencha o campo Telefone" });
      }


      //validação de Telefone existente
      const phonee = await prisma.client.findFirst({
        where: { phone: body.phone, NOT: { id: Number(req.params.id) } }
      })

      if (phonee) {
        return res.status(422).json({ error: "Já existe umm Cliente Cadastrado com esse Telefone" });
      }

      if (campoVazio(body.email)) {
        return res.status(400).json({ error: "Preencha o campo Email" });
      }

      if (!validaemail(body.email)) {
        return res.status(422).json({ erro: "Email Inválido" });
      }

      //validação de Email existente
      const emaill = await prisma.client.findFirst({
        where: { email: body.email, NOT: { id: Number(req.params.id) } }
      })

      if (emaill) {
        return res.status(422).json({ error: "Já existe um Cliente Cadastrado com esse Email" });
      }

      const id = Number(req.params.id);

      const clientExists = await prisma.client.findFirst({
        where: { id: Number(req.params.id), userId: req.logado.id },
      });

      if (!clientExists) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      const clientUpdate = await prisma.client.update({
        where: { id: clientExists.id },
        data: body,
      });


      return res.status(200).json({ message: "Dados do Cliente Alterado com Sucesso!" });
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },
};
