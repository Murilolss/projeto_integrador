import { Router } from "express"; 
import { SignatureController } from "../controllers/signature.js";
import { verificaToken } from "../middlewares/auth.js";

const route  = new Router();

route.post('/', verificaToken, SignatureController.store);

// Plano Mercado Pago
route.post('/plan', SignatureController.planmp);

route.get('/', verificaToken, SignatureController.index);
route.get('/:id', SignatureController.show);
route.delete('/:id', SignatureController.del);
route.put('/:id', verificaToken, SignatureController.update);

export default route;