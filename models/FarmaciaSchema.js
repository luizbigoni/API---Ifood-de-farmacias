import mongoose from 'mongoose';

const FarmaciaSchema = new mongoose.Schema(
    {
        nome: {type: String, required: true},
        cnpj: {type: String, required: true, unique: true},
        email: {type: String, required: true, unique: true},
        senha: {type: String, required: true},
        telefone: {type: String, required: true},
        taxaEntrega: {type: Number, required: true},
        aberta: {type: Boolean, required: true},
        endereco: {type: mongoose.Schema.Types.Mixed, required: true},
    },
    {
        timestamps: true, // Cria campos de createdAt e updatedAt automaticamente
    }
);
const FarmaciaModel = mongoose.model('Farmacia', FarmaciaSchema);

export default FarmaciaModel;
