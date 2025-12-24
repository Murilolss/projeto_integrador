import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import clientRoutes from './routes/client.js'
import orderRoutes from './routes/order.js'
import productRoutes from './routes/product.js'
import serviceRoutes from './routes/service.js'
import shopRoutes from './routes/shop.js'
import signatureRoutes from './routes/signature.js'
import userRoutes from './routes/user.js'
import GroupRoutes from './routes/groups.js'
import { verificaToken } from './middlewares/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/clients', verificaToken, clientRoutes)
app.use('/orders', verificaToken, orderRoutes)
app.use('/products', verificaToken, productRoutes)
app.use('/services', verificaToken, serviceRoutes)
app.use('/signatures', signatureRoutes)
// app.use('/signatures', verificaToken, signatureRoutes) Desativado para testes, por favor reativar quando subir o teste
app.use('/shops', shopRoutes)
app.use('/users', userRoutes)
app.use('/groups', GroupRoutes)

app.use((err, _req, res, _next) => {
    console.error(err);
    if (err.code === 'P2002'){
        return res.status(409).json({
            error: 'Registro duplicado (unique)'
        });
    }
    if (err.code === 'P2025'){
        return res.status(404).json({
            error: 'Registro não encontrado'
        });
    }
    res.status(500).json({error: 'Erro interno'});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HTTP => http://localhost:${PORT}`));