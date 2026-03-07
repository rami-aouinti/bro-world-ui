<script setup lang="ts">
const files = defineModel<File[]>({ default: () => [] })

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const openPicker = () => {
  fileInput.value?.click()
}

const addFiles = (incoming: FileList | File[]) => {
  const toAdd = Array.from(incoming)
  files.value = [...files.value, ...toAdd]
}

const onInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  addFiles(target.files)
  target.value = ''
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  if (!event.dataTransfer?.files?.length) return
  addFiles(event.dataTransfer.files)
}

const removeFile = (index: number) => {
  files.value = files.value.filter((_, idx) => idx !== index)
}
</script>

<template>
  <div>
    <div
      class="shop-dropzone rounded-xl pa-6 border-md border-dashed"
      :class="isDragging ? 'shop-dropzone--active' : ''"
      role="button"
      tabindex="0"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop="onDrop"
    >
      <p class="text-subtitle-1 font-weight-bold mb-1">{{ $t('platform.shop.newProduct.media.dropzoneTitle') }}</p>
      <p class="text-body-2 text-medium-emphasis mb-0">{{ $t('platform.shop.newProduct.media.dropzoneSubtitle') }}</p>
      <input ref="fileInput" type="file" multiple class="d-none" @change="onInputChange">
    </div>

    <v-list v-if="files.length" class="mt-3" density="compact" variant="text">
      <v-list-item v-for="(file, index) in files" :key="`${file.name}-${index}`" :title="file.name" :subtitle="`${Math.round(file.size / 1024)} KB`">
        <template #append>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click.stop="removeFile(index)" />
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<style scoped>
.shop-dropzone {
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  border-color: rgba(255, 255, 255, 0.2);
}

.shop-dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
