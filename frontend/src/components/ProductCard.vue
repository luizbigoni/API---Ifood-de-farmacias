<script setup>
defineProps({
    produto: { type: Object, required: true },
    quantidade: { type: Number, default: 1 },
    farmacia: { type: String, default: 'Farmacia' },
    dinheiro: { type: Function, required: true }
});

const emit = defineEmits(['add', 'update:quantidade']);

function fotoProduto(produto) {
    return produto.imagem || '/img/medicamentos.png';
}
</script>

<template>
    <article class="produto-card">
        <div class="produto-foto">
            <img :src="fotoProduto(produto)" :alt="produto.nome">
        </div>
        <div class="produto-info">
            <p class="produto-farmacia">{{ farmacia }}</p>
            <h3>{{ produto.nome }}</h3>
            <p>{{ produto.descricao }}</p>
            <strong>{{ dinheiro(produto.preco) }}</strong>
        </div>
        <div class="produto-acoes">
            <input
                type="number"
                min="1"
                :max="produto.quantidade"
                :value="quantidade"
                @input="emit('update:quantidade', Number($event.target.value || 1))"
            >
            <button type="button" @click="emit('add', produto)" :disabled="produto.quantidade < 1">
                Adicionar
            </button>
        </div>
    </article>
</template>
