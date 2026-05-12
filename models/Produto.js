import ProdutoModel from "./ProdutoSchema.js";

class Produto {
    #nome;
    #descricao;
    #preco;
    #quantidade;
    #farmacia;

    constructor(nome, descricao, preco, quantidade, farmacia) {
        this.#nome = nome;
        this.#descricao = descricao;
        this.#preco = preco;
        this.#quantidade = quantidade;
        this.#farmacia = farmacia;
    }

    getNome() {
        return this.#nome;
    }

    setNome(nome) {
        this.#nome = nome;
    }

    getDescricao() {
        return this.#descricao;
    }

    setDescricao(descricao) {
        this.#descricao = descricao;
    }

    getPreco() {
        return this.#preco;
    }

    setPreco(preco) {
        this.#preco = preco;
    }

    getQuantidade() {
        return this.#quantidade;
    }

    setQuantidade(quantidade) {
        this.#quantidade = quantidade;
    }

    getFarmacia() {
        return this.#farmacia;
    }

    setFarmacia(farmacia) {
        this.#farmacia = farmacia;
    }

    async save() {
        return await Produto.save(this);
    }

    static async save(produto) {
        const novoProduto = new ProdutoModel({
            nome: produto.getNome(),
            descricao: produto.getDescricao(),
            preco: produto.getPreco(),
            quantidade: produto.getQuantidade(),
            farmacia: produto.getFarmacia(),
        });

        return await novoProduto.save();
    }

    static async findAll() {
        return await ProdutoModel.find()
            .populate('farmacia', 'nome cnpj email telefone')
            .sort({ createdAt: -1 });
    }

    static async findById(id) {
        return await ProdutoModel.findById(id)
            .populate('farmacia', 'nome cnpj email telefone');
    }

    static async findByFarmacia(farmaciaId) {
        return await ProdutoModel.find({ farmacia: farmaciaId })
            .populate('farmacia', 'nome cnpj email telefone')
            .sort({ createdAt: -1 });
    }

    static async update(id, dadosProduto) {
        return await ProdutoModel.findByIdAndUpdate(
            id,
            dadosProduto,
            { new: true, runValidators: true }
        ).populate('farmacia', 'nome cnpj email telefone');
    }

    static async delete(id) {
        return await ProdutoModel.findByIdAndDelete(id);
    }
}

export default Produto;
