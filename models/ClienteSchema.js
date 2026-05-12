import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema(
    {
        nome: { type: String, required: true, trim: true },
        cpf: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true },
        senha: { type: String, required: true },
        telefone: { type: String, required: true },
        endereco: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    {
        timestamps: true,
    }
);

const ClienteModel = mongoose.model('Cliente', ClienteSchema);

export default ClienteModel;
