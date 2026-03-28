<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import ProfileSidebarCard from '~/components/profile/ProfileSidebarCard.vue'
import { useLibraryApi } from '~/composables/api/useLibraryApi'
import type { LibraryFolderNode, LibraryTreeNode } from '~/types/api/library'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const libraryApi = useLibraryApi()

const isLoading = ref(true)
const isSubmitting = ref(false)
const tree = ref<LibraryFolderNode>({ id: 'root', name: 'Library', type: 'folder', children: [] })
const currentFolderId = ref<string | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const search = ref('')
const showCreateFolderDialog = ref(false)
const showRenameDialog = ref(false)
const folderName = ref('')
const renameName = ref('')
const renameTarget = ref<LibraryTreeNode | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const draggingNodeId = ref<string | null>(null)
const draggingNodeType = ref<'folder' | 'file' | null>(null)
const dragOverFolderId = ref<string | null>(null)

const iconByFileType: Record<string, string> = {
  image: 'mdi-file-image-outline',
  video: 'mdi-file-video-outline',
  audio: 'mdi-file-music-outline',
  document: 'mdi-file-document-outline',
}

const formatBytes = (size?: number) => {
  if (!size || size <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

const getFolderById = (folderId: string | null, node: LibraryFolderNode = tree.value): LibraryFolderNode | null => {
  if (!folderId) return tree.value
  if (node.id === folderId) return node

  for (const child of node.children) {
    if (child.type !== 'folder') continue
    const found = getFolderById(folderId, child)
    if (found) return found
  }

  return null
}

const findPathToFolder = (
  folderId: string | null,
  node: LibraryFolderNode = tree.value,
  path: LibraryFolderNode[] = [tree.value],
): LibraryFolderNode[] => {
  if (!folderId) return [tree.value]
  if (node.id === folderId) return path

  for (const child of node.children) {
    if (child.type !== 'folder') continue
    const childPath = findPathToFolder(folderId, child, [...path, child])
    if (childPath.length && childPath[childPath.length - 1]?.id === folderId) {
      return childPath
    }
  }

  return [tree.value]
}

const hasFolderInTree = (node: LibraryFolderNode, searchedId: string): boolean => {
  if (node.id === searchedId) return true

  for (const child of node.children) {
    if (child.type !== 'folder') continue
    if (hasFolderInTree(child, searchedId)) return true
  }

  return false
}

const findParentFolderId = (
  nodeId: string,
  parent: LibraryFolderNode = tree.value,
): string | null | undefined => {
  for (const child of parent.children) {
    if (child.id === nodeId) return parent.id === 'root' ? null : parent.id
    if (child.type === 'folder') {
      const found = findParentFolderId(nodeId, child)
      if (found !== undefined) return found
    }
  }

  return undefined
}

const currentFolder = computed(() => getFolderById(currentFolderId.value) ?? tree.value)
const breadcrumb = computed(() => findPathToFolder(currentFolderId.value))

const displayedItems = computed(() => {
  const term = search.value.trim().toLowerCase()
  const items = currentFolder.value.children

  if (!term) return items
  return items.filter(item => item.name.toLowerCase().includes(term))
})

const folderFlatItems = computed(() => {
  const flatten = (node: LibraryFolderNode, depth = 0): Array<{ id: string | null, name: string, depth: number }> => {
    const children = node.children.filter(child => child.type === 'folder') as LibraryFolderNode[]

    return children.flatMap((folder) => {
      const item = { id: folder.id, name: folder.name, depth }
      return [item, ...flatten(folder, depth + 1)]
    })
  }

  return [{ id: null, name: 'Library', depth: 0 }, ...flatten(tree.value, 1)]
})

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const openFolder = (folderId: string | null) => {
  currentFolderId.value = folderId
}

const enterItem = (item: LibraryTreeNode) => {
  if (item.type === 'folder') {
    openFolder(item.id)
    return
  }

  if (item.url) {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }
}

const openParent = () => {
  const path = breadcrumb.value
  if (path.length <= 1) {
    currentFolderId.value = null
    return
  }

  const parent = path[path.length - 2]
  currentFolderId.value = parent?.id === 'root' ? null : (parent?.id ?? null)
}

const fetchTree = async () => {
  isLoading.value = true
  try {
    const response = await libraryApi.getTree()
    tree.value = {
      id: 'root',
      name: 'Library',
      type: 'folder',
      children: response.children ?? [],
    }

    if (currentFolderId.value && !getFolderById(currentFolderId.value)) {
      currentFolderId.value = null
    }
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger la bibliothèque média.'
  }
  finally {
    isLoading.value = false
  }
}

const createFolder = async () => {
  const name = folderName.value.trim()
  if (!name) return

  clearMessages()
  isSubmitting.value = true

  try {
    await libraryApi.createFolder({ name, parentId: currentFolderId.value ?? undefined })
    folderName.value = ''
    showCreateFolderDialog.value = false
    successMessage.value = 'Dossier créé avec succès.'
    await fetchTree()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'La création du dossier a échoué.'
  }
  finally {
    isSubmitting.value = false
  }
}

const triggerUpload = () => fileInput.value?.click()

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return

  clearMessages()
  isSubmitting.value = true

  try {
    await Promise.all(Array.from(files).map(file => libraryApi.uploadFile(file, currentFolderId.value ?? undefined)))
    successMessage.value = 'Upload terminé.'
    await fetchTree()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'L\'upload du fichier a échoué.'
  }
  finally {
    input.value = ''
    isSubmitting.value = false
  }
}

const requestDelete = async (item: LibraryTreeNode) => {
  const confirmed = window.confirm(`Supprimer "${item.name}" ?`)
  if (!confirmed) return

  clearMessages()
  isSubmitting.value = true

  try {
    if (item.type === 'folder') {
      await libraryApi.deleteFolder(item.id)
    }
    else {
      await libraryApi.deleteFile(item.id)
    }

    successMessage.value = 'Élément supprimé.'
    await fetchTree()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'La suppression a échoué.'
  }
  finally {
    isSubmitting.value = false
  }
}

const openRenameDialog = (item: LibraryTreeNode) => {
  renameTarget.value = item
  renameName.value = item.name
  showRenameDialog.value = true
}

const saveRename = async () => {
  const target = renameTarget.value
  const newName = renameName.value.trim()
  if (!target || !newName) return

  clearMessages()
  isSubmitting.value = true

  try {
    if (target.type === 'folder') {
      await libraryApi.patchFolder(target.id, { name: newName })
    }
    else {
      await libraryApi.patchFile(target.id, { name: newName })
    }

    showRenameDialog.value = false
    renameTarget.value = null
    successMessage.value = 'Nom mis à jour.'
    await fetchTree()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de renommer cet élément.'
  }
  finally {
    isSubmitting.value = false
  }
}

const onDragStart = (item: LibraryTreeNode) => {
  draggingNodeId.value = item.id
  draggingNodeType.value = item.type
}

const onDragEnd = () => {
  draggingNodeId.value = null
  draggingNodeType.value = null
  dragOverFolderId.value = null
}

const moveNodeToFolder = async (targetFolderId: string | null) => {
  const draggedId = draggingNodeId.value
  const draggedType = draggingNodeType.value
  if (!draggedId || !draggedType) return

  const currentParentId = findParentFolderId(draggedId)
  if (currentParentId === targetFolderId) {
    onDragEnd()
    return
  }

  if (draggedType === 'folder') {
    const draggedFolder = getFolderById(draggedId)
    if (draggedFolder && targetFolderId && hasFolderInTree(draggedFolder, targetFolderId)) {
      errorMessage.value = 'Vous ne pouvez pas déplacer un dossier dans son propre sous-dossier.'
      onDragEnd()
      return
    }
  }

  clearMessages()
  isSubmitting.value = true

  try {
    if (draggedType === 'folder') {
      await libraryApi.patchFolder(draggedId, { parentId: targetFolderId })
    }
    else {
      await libraryApi.patchFile(draggedId, { folderId: targetFolderId })
    }

    successMessage.value = 'Élément déplacé.'
    await fetchTree()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Le déplacement a échoué.'
  }
  finally {
    onDragEnd()
    isSubmitting.value = false
  }
}

const onDragOverFolder = (event: DragEvent, folderId: string | null) => {
  if (!draggingNodeId.value) return
  event.preventDefault()
  dragOverFolderId.value = folderId
}

onMounted(fetchTree)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <ProfileSidebarCard />
    </template>
    <template #aside>
      <h2 class="text-subtitle-1 font-weight-bold mb-3">Folders</h2>
      <v-skeleton-loader v-if="isLoading" type="list-item-two-line@5" />
      <div v-else>
        <v-list class="bg-transparent library-tree" density="compact" nav>
          <v-list-item
              v-for="item in folderFlatItems"
              :key="item.id ?? 'root'"
              rounded="lg"
              :class="{ 'drop-target': dragOverFolderId === (item.id ?? null) }"
              :active="(item.id ?? null) === currentFolderId"
              @click="openFolder(item.id ?? null)"
              @dragover="onDragOverFolder($event, item.id ?? null)"
              @dragleave="dragOverFolderId = null"
              @drop.prevent="moveNodeToFolder(item.id ?? null)"
          >
            <template #prepend>
              <v-icon icon="mdi-folder-outline" color="warning" />
            </template>
            <v-list-item-title :style="{ paddingLeft: `${item.depth * 10}px` }">{{ item.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <div class="d-flex ga-2 flex-wrap justify-center">
          <v-btn color="primary" prepend-icon="mdi-folder-plus-outline" :loading="isSubmitting" @click="showCreateFolderDialog = true">
            New folder
          </v-btn>
          <v-btn color="secondary" prepend-icon="mdi-upload" :loading="isSubmitting" @click="triggerUpload">
            Upload file
          </v-btn>
        </div>
      </div>
    </template>
    <section class="library-page">
      <input ref="fileInput" type="file" class="d-none" multiple @change="onFileSelected">
      <v-card rounded="xl" class="pa-4 library-pane" elevation="0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
          <div>
            <div class="d-flex flex-wrap align-center ga-2 mb-1">
              <v-chip
                  v-for="(folder, index) in breadcrumb"
                  :key="folder.id"
                  size="small"
                  variant="tonal"
                  color="primary"
                  @click="openFolder(index === 0 ? null : folder.id)"
              >
                {{ folder.name }}
              </v-chip>
            </div>
            <h3 class="text-h6 font-weight-bold mb-0">{{ currentFolder.name }}</h3>
          </div>

          <div class="d-flex ga-2 align-center">
            <v-btn variant="text" prepend-icon="mdi-arrow-up" :disabled="breadcrumb.length <= 1" @click="openParent">Parent</v-btn>
            <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Search"
                hide-details
                density="compact"
                variant="outlined"
                style="max-width: 260px"
            />
          </div>
        </div>

        <v-skeleton-loader v-if="isLoading" type="table-heading, table-row-divider@6" />

        <v-table v-else class="library-table">
          <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th class="text-right">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="item in displayedItems"
              :key="item.id"
              class="library-row"
              :class="{ 'drop-target': item.type === 'folder' && dragOverFolderId === item.id }"
              draggable="true"
              @dragstart="onDragStart(item)"
              @dragend="onDragEnd"
              @dragover="item.type === 'folder' ? onDragOverFolder($event, item.id) : null"
              @dragleave="item.type === 'folder' ? (dragOverFolderId = null) : null"
              @drop.prevent="item.type === 'folder' ? moveNodeToFolder(item.id) : null"
              @dblclick="enterItem(item)"
          >
            <td>
              <button class="library-item-btn" type="button" @click="enterItem(item)">
                <v-icon
                    :icon="item.type === 'folder' ? 'mdi-folder-outline' : (iconByFileType[item.fileType || ''] || 'mdi-file-outline')"
                    class="mr-2"
                    :color="item.type === 'folder' ? 'warning' : 'primary'"
                />
                {{ item.name }}
              </button>
            </td>
            <td>{{ item.type === 'folder' ? 'Folder' : (item.mimeType || item.fileType || 'File') }}</td>
            <td>{{ item.type === 'folder' ? '—' : formatBytes(item.size) }}</td>
            <td class="text-right">
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" />
                </template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-pencil-outline" title="Rename" @click="openRenameDialog(item)" />
                  <v-list-item prepend-icon="mdi-delete-outline" title="Delete" @click="requestDelete(item)" />
                </v-list>
              </v-menu>
            </td>
          </tr>
          <tr v-if="!displayedItems.length">
            <td colspan="4" class="text-medium-emphasis py-8 text-center">
              Ce dossier est vide. Ajoutez un dossier ou un fichier pour commencer.
            </td>
          </tr>
          </tbody>
        </v-table>

        <div class="d-flex justify-end mt-3">
          <v-btn
              variant="tonal"
              color="primary"
              prepend-icon="mdi-arrow-up-bold"
              :disabled="!draggingNodeId"
              @dragover.prevent="onDragOverFolder($event, null)"
              @drop.prevent="moveNodeToFolder(null)"
          >
            Drop to root
          </v-btn>
        </div>
      </v-card>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">{{ successMessage }}</v-alert>

      <v-dialog v-model="showCreateFolderDialog" max-width="460">
        <v-card rounded="xl" class="pa-2">
          <v-card-title class="text-h6">Create a folder</v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-3">
              Le dossier sera ajouté dans <strong>{{ currentFolder.name }}</strong>.
            </p>
            <v-text-field
              v-model="folderName"
              label="Folder name"
              autofocus
              variant="outlined"
              density="comfortable"
              @keydown.enter="createFolder"
            />
          </v-card-text>
          <v-card-actions class="justify-end px-4 pb-4">
            <v-btn variant="text" @click="showCreateFolderDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isSubmitting" :disabled="!folderName.trim()" @click="createFolder">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showRenameDialog" max-width="460">
        <v-card rounded="xl" class="pa-2">
          <v-card-title class="text-h6">Rename</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="renameName"
              label="Name"
              autofocus
              variant="outlined"
              density="comfortable"
              @keydown.enter="saveRename"
            />
          </v-card-text>
          <v-card-actions class="justify-end px-4 pb-4">
            <v-btn variant="text" @click="showRenameDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isSubmitting" :disabled="!renameName.trim()" @click="saveRename">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.library-page {
  min-height: 100%;
}

.library-pane {
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-primary), 0.03) 100%);
}

.library-tree {
  max-height: 75vh;
  overflow: auto;
}

.library-table :deep(table) {
  width: 100%;
}

.library-row:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.library-item-btn {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  cursor: pointer;
  padding: 10px 2px;
}

.library-item-btn:hover {
  color: rgb(var(--v-theme-primary));
}

.drop-target {
  background: rgba(var(--v-theme-primary), 0.12) !important;
  outline: 1px dashed rgba(var(--v-theme-primary), 0.8);
}
</style>
