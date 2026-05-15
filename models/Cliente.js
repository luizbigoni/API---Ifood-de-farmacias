import ClienteModel from "./ClienteSchema.js";

class Cliente {
    #nome;
    #cpf;
    #email;
    #senha;
    #telefone;
    #endereco;

    constructor(nome, cpf, email, senha, telefone, endereco) {
        this.#nome = nome;
        this.#cpf = cpf;
        this.#email = email;
        this.#senha = senha;
        this.#telefone = telefone;
        this.#endereco = endereco;
    }

    getNome() {
        return this.#nome;
    }

    setNome(nome) {
        this.#nome = nome;
    }

    getCpf() {
        return this.#cpf;
    }

    setCpf(cpf) {
        this.#cpf = cpf;
    }

    getEmail() {
        return this.#email;
    }

    setEmail(email) {
        this.#email = email;
    }

    getSenha() {
        return this.#senha;
    }

    setSenha(senha) {
        this.#senha = senha;
    }

    getTelefone() {
        return this.#telefone;
    }

    setTelefone(telefone) {
        this.#telefone = telefone;
    }

    getEndereco() {
        return this.#endereco;
    }

    setEndereco(endereco) {
        this.#endereco = endereco;
    }

    async save() {
        return await Cliente.save(this);
    }

    static async save(cliente) {
        const novoCliente = new ClienteModel({
            nome: cliente.getNome(),
            cpf: cliente.getCpf(),
            email: cliente.getEmail(),
            senha: cliente.getSenha(),
            telefone: cliente.getTelefone(),
            endereco: cliente.getEndereco(),
        });

        return await novoCliente.save();
    }

    static async findAll() {
        return await ClienteModel.find()
            .sort({ createdAt: -1 });
    }

    static async findById(id) {
        return await ClienteModel.findById(id);
    }

    static async findByCpf(cpf) {
        return await ClienteModel.findOne({ cpf });
    }

    static async findByEmail(email) {
        return await ClienteModel.findOne({ email: String(email || '').trim().toLowerCase() });
    }

    static async update(id, dadosCliente) {
        return await ClienteModel.findByIdAndUpdate(
            id,
            dadosCliente,
            { new: true, runValidators: true }
        );
    }

    static async delete(id) {
        return await ClienteModel.findByIdAndDelete(id);
    }
}

export default Cliente;
