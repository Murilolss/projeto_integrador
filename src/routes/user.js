import { Router } from 'express';
import { UserController } from '../controllers/user.js'
import { verificaToken } from '../middlewares/auth.js';

const route = new Router();

route.post('/',  UserController.store);
route.post('/login', UserController.login);
route.get('/',  UserController.index);
route.get("/me", verificaToken, UserController.me);
route.get('/:id', verificaToken,  UserController.show);
route.put('/:id', verificaToken,  UserController.update);
route.delete('/:id', verificaToken, UserController.del);

export default route;