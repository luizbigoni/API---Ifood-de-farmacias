import FarmaciaModel from "./FarmaciaSchema";

class Farmacia {
    constructor(nome, cnpj, email, senha, telefone, taxaEntrega, aberta, endereco) {
        this.nome = nome;
        this.cnpj = cnpj;
        this.email = email;
        this.senha = senha;
        this.telefone = telefone;
        this.taxaEntrega = taxaEntrega;
        this.aberta = aberta;
        this.endereco = endereco;
    }

    // Métodos getters e setters para cada propriedade
    getNome() {
        return this.nome;
    }

    setNome(nome) {
        this.nome = nome;
    }

    getCnpj() {
        return this.cnpj;
    }

    setCnpj(cnpj) {
        this.cnpj = cnpj;
    }

    getEmail() {
        return this.email;
    }

    setEmail(email) {
        this.email = email;
    }

    getSenha() {
        return this.senha;
    }
    
    setSenha(senha) {
        this.senha = senha;
    }  

    getTelefone() {
        return this.telefone;
    }

    setTelefone(telefone) {
        this.telefone = telefone;
    }   

    getTaxaEntrega() {
        return this.taxaEntrega;
    }

    setTaxaEntrega(taxaEntrega) {
        this.taxaEntrega = taxaEntrega;
    }   

    getAberta() {
        return this.aberta;
    }

    setAberta(aberta) {
        this.aberta = aberta;
    }

    getEndereco() {
        return this.endereco;
    }

    setEndereco(endereco) {
        this.endereco = endereco;
    }   

    static async save(farmacia) {
        const novaFarmacia = new FarmaciaModel({
            nome: farmacia.getNome(),
            cnpj: farmacia.getCnpj(),
            email: farmacia.getEmail(),
            senha: farmacia.getSenha(),
            telefone: farmacia.getTelefone(),
            taxaEntrega: farmacia.getTaxaEntrega(),
            aberta: farmacia.getAberta(),
            endereco: farmacia.getEndereco(),
        });
        return await novaFarmacia.save();
    }



    static async findAll(){
        return await FarmaciaModel.find();
    }

    static async findById(id){
        return await FarmaciaModel.findById(id);
    }

        static async findByCnpj(cnpj){
            return await FarmaciaModel.findOne({cnpj : cnpj});
    }

    static async delete(id){
        return await FarmaciaModel.findByIdAndDelete(id);
    }



}

export default Farmacia;    