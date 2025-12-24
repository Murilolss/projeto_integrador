import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const UserController = {
  async store(req, res, next) {
    try {
      const {
        name,
        lastName,
        email,
        password,
        companyName,
        corporateReason,
        document,
        stateRegistration,
        cep,
        address,
        number,
        neighborhood,
        state,
        city,
        phone,
        site,
        birth,
      } = req.body;

      // Verificção de Email Valido
      function validaemail() {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }

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

      // Verificção de CPF/CNPJ Valido
      function validaCpfCnpj(documento) {
        const doc = String(documento).replace(/[^\d]/g, "");

        if (doc.length === 11) {
          if (/^0{11}$/.test(doc)) return false;

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
          if (/^0{14}$/.test(doc)) return false;

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

      if (campoVazio(name)) {
        return res.status(400).json(`O Campo Nome está Vazio`);
      }

      if (campoVazio(lastName)) {
        return res.status(400).json(`O Campo Sobrenome está Vazio`);
      }

      if (campoVazio(document)) {
        return res.status(400).json(`O Campo CPF ou CNPJ está Vazio`);
      }

      //validação de CPF ou CNPJ existente
      const documentt = await prisma.user.findFirst({
        where: { document },
      });

      if (documentt) {
        if (document.length === 14) {
          return res.status(409).json("O CPF Já está cadastrado");
        } else if (document.length === 18) {
          return res.status(409).json("O CNPJ Já está cadastrado");
        }
      }

      if (!validaCpfCnpj(document)) {
        return res.status(422).json("CNPJ ou CPF inválido");
      }

      if (document.length === 18 && campoVazio(corporateReason)) {
        return res.status(400).json(`O Campo Razão Social está Vazio`);
      }

      if (document.length === 18 && campoVazio(stateRegistration)) {
        return res.status(400).json(`Preencha o Campo Inscrição Estadual`);
      }

      if (campoVazio(companyName)) {
        return res.status(400).json(`O Campo Nome da Empresa está Vazio`);
      }

      if (campoVazio(cep)) {
        return res.status(400).json(`O Campo CEP está Vazio`);
      }

      if (campoVazio(address)) {
        return res.status(400).json(`O Campo Endereço está Vazio`);
      }

      if (campoVazio(number)) {
        return res.status(400).json(`O Campo Número está Vazio`);
      }

      if (campoVazio(neighborhood)) {
        return res.status(400).json(`O Campo Bairro está Vazio`);
      }

      if (campoVazio(state)) {
        return res.status(400).json(`O Campo Estado está Vazio`);
      }

      if (campoVazio(city)) {
        return res.status(400).json(`O Campo Cidade está Vazio`);
      }

      if (campoVazio(phone)) {
        return res.status(400).json(`O Campo Telefone está Vazio`);
      }

      if (campoVazio(email)) {
        return res.status(400).json(`O Campo Email está Vazio`);
      }

      if (!validaemail(email)) {
        return res.status(422).json("Email Inválido");
      }

      // Validação de email existente
      let emaill = await prisma.user.findFirst({
        where: { email },
      });

      if (emaill) {
        return res.status(409).json("Email Já Cadastrado");
      }

      if (campoVazio(password)) {
        return res.status(400).json(`O Campo Senha está Vazio`);
      }

      //validação de senha de pelo menos 8 Caracterer
      if (password.length < 8) {
        return res
          .status(422)
          .json("A Senha deve conter no mínimo 8 caracteres");
      }

      const hash = await bcrypt.hash(password, 8);

      const user = await prisma.user.create({
        data: {
          name,
          lastName,
          email,
          password: hash,
          companyName,
          corporateReason,
          document,
          stateRegistration,
          cep,
          address,
          number: Number(number),
          neighborhood,
          state,
          city,
          phone,
          site,
          birth,
        },
      });
      
      const free = await prisma.group.findFirst({
        where: { name: "Free" }
      });

      await prisma.signature.create({
        data: {
          type: "Free",
          isActive: true,
          userId: user.id,
          groupId: free.id
        }
      });


      await prisma.groupUser.create({
        data: {
          userId: user.id,
          groupId: free.id,
        },
      });




      res.status(200).json("Usuário Cadastrado Com Sucesso");
    } catch (error) {
      next(error);
    }
  },

  async index(req, res, _next) {
    try {
      let query = {};

      if (req.query.email) {
        query.email = req.query.email;
      }

      if (req.query.document) {
        query.document = req.query.document;
      }

      if (req.query.signature) {
        query.signature = req.query.signature;
      }

      if (req.query.isActive) {
        query.isActive =
          req.query.isActive === "true" || req.query.isActive === true;
      }

      const users = await prisma.user.findMany({
        where: query,
      });
      if (users.length == 0) {
        res.status(404).json("Nada encontrado");
      } else {
        res.status(200).json(users);
      }
    } catch (error) {
      res.status(500).json({ error: "Erro interno ao buscar Users" });
    }
  },

  async show(req, res, _next) {
    try {
      const id = Number(req.params.id);

      let user = await prisma.user.findFirstOrThrow({ where: { id } });

      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  async del(req, res, _next) {
    try {
      const id = Number(req.params.id);

      let user = await prisma.user.delete({ where: { id } });

      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  async update(req, res, _next) {
    try {
      let body = {};

      if (req.body.email) {
        body.email = req.body.email;
      }

      if (req.body.document) {
        body.document = req.body.document;
      }

      if (req.body.phone) {
        body.phone = req.body.phone;
      }

      if (req.body.signature) {
        body.signature = req.body.signature;
      }

      if (req.body.isActive) {
        body.isActive = Boolean(req.body.isActive);
      }

      if (
        typeof req.body.password === "string" &&
        req.body.password.trim() !== ""
      ) {
        const hash = await bcrypt.hash(req.body.password, 10);
        body.password = hash;
      }

      const id = Number(req.params.id);

      const userUpdate = await prisma.user.update({
        where: { id },
        data: body,
      });

      res.status(200).json(userUpdate);
    } catch (err) {
      res.status(404).json({ error: "Não encontrado" });
    }
  },

  async login(req, res, next) {
    try {
      const { email, senha } = req.body;

      let user = await prisma.user.findFirst({
        where: { email },
        include: {
          groups: {
            include: {
              group: true
            }
          }
        }
      });

      if (!user) {
        res.status(404).json("Usuário com esse email não encontrado");
        return;
      }

      const ok = await bcrypt.compare(senha, user.password);
      if (!ok) {
        return res.status(404).json("Usuário ou Senha Incorretos");
      };

      const groups = user.groups.map(g => g.group.name);

      const token = jwt.sign(
        { sub: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          groups
        }
      });
    } catch (e) {
      next(e);
    }
  },

  async me(req, res) {
    try {
      const userId = req.logado.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        groups: user.groups.map(g => g.group.name),
      });
    } catch (e) {
      return res.status(500).json({ error: "Erro interno" });
    }
  },

};
