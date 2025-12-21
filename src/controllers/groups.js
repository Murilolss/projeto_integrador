import prisma from "../prisma.js";

export const GroupsControler = {
  async index(req, res) {
    try {
      const groups = await prisma.group.findMany({
        include: {
          users: {
            include: {
              user: true,
            },
          },
        },
      });

      return res.json(
        groups.map(group => ({
          id: group.id,
          name: group.name,
          users: group.users.map(u => ({
            id: u.user.id,
            name: u.user.name,
            email: u.user.email,
          })),
        }))
      );
    } catch {
      return res.status(500).json({ error: "Erro interno" });
    }
  },
};
