<template>
  <div class="q-gutter-sm">
    <q-btn color="teal" icon="add" label="Add Order" @click="$emit('add')" />
    <q-btn color="secondary" icon="edit" label="Edit Order" @click="$emit('edit')" />
    <q-btn color="negative" icon="delete" label="Delete Order" @click="$emit('delete')" />
  </div>
</template>

<script setup>
// Non serve logica extra, solo emettiamo gli eventi
</script>
