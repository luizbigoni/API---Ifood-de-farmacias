import mongoose from 'mongoose';

const ProdutoSchema = new mongoose.Schema(
    {
        nome: { type: String, required: true, trim: true },
        descricao: { type: String, required: true, trim: true },
        categoria: {
            type: String,
            required: true,
            enum: ['Dor e febre', 'Gripe', 'Vitaminas', 'Primeiros socorros', 'Higiene', 'Geral'],
            default: 'Geral'
        },
        imagem: { type: String, trim: true, default: '' },
        preco: { type: Number, required: true, min: 0 },
        quantidade: { type: Number, required: true, min: 0 },
        farmacia: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Farmacia',
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const ProdutoModel = mongoose.model('Produto', ProdutoSchema);

export default ProdutoModel;
