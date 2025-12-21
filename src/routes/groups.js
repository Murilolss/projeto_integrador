import { Router } from 'express';
import { GroupsControler } from '../controllers/groups.js';


const route = new Router();

route.get('/', GroupsControler.index);

export default route;