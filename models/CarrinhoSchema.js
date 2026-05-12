import mongoose from 'mongoose';

const ItemCarrinhoSchema = new mongoose.Schema(
    {
        produto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produto',
            required: true
        },
        quantidade: { type: Number, required: true, min: 1 },
        precoUnitario: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const CarrinhoSchema = new mongoose.Schema(
    {
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cliente',
            required: true
        },
        farmacia: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Farmacia',
            default: null
        },
        itens: {
            type: [ItemCarrinhoSchema],
            default: []
        },
        quantidadeTotal: { type: Number, default: 0, min: 0 },
        valorTotal: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ['aberto', 'finalizado'],
            default: 'aberto'
        }
    },
    {
        timestamps: true,
    }
);

const CarrinhoModel = mongoose.model('Carrinho', CarrinhoSchema);

export default CarrinhoModel;
