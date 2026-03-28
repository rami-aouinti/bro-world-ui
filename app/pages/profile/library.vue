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
const search = ref('')
const showCreateFolderDialog = ref(false)
const folderName = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

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

const findPathToFolder = (folderId: string | null, node: LibraryFolderNode = tree.value, path: LibraryFolderNode[] = [tree.value]): LibraryFolderNode[] => {
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

  return [
    { id: null, name: 'Library', depth: 0 },
    ...flatten(tree.value, 1),
  ]
})

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
  errorMessage.value = ''
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

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await libraryApi.createFolder({
      name,
      parentId: currentFolderId.value ?? undefined,
    })

    folderName.value = ''
    showCreateFolderDialog.value = false
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

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await Promise.all(Array.from(files).map(file => libraryApi.uploadFile(file, currentFolderId.value ?? undefined)))
    await fetchTree()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'L\'upload du fichier a échoué.'
  }
  finally {
    if (input) input.value = ''
    isSubmitting.value = false
  }
}

onMounted(fetchTree)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <ProfileSidebarCard />
    </template>

    <section class="library-page">
      <v-card class="pa-4 mb-4 library-header" rounded="xl" elevation="0">
        <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
          <div>
            <p class="text-overline mb-1 text-medium-emphasis">Media workspace</p>
            <h1 class="text-h5 font-weight-bold mb-1">Library</h1>
            <p class="text-body-2 text-medium-emphasis mb-0">
              Gérez vos dossiers et vos fichiers dans une interface inspirée de l\'explorateur Windows.
            </p>
          </div>
          <div class="d-flex ga-2">
            <v-btn color="primary" prepend-icon="mdi-folder-plus-outline" :loading="isSubmitting" @click="showCreateFolderDialog = true">
              New folder
            </v-btn>
            <v-btn color="secondary" prepend-icon="mdi-upload" :loading="isSubmitting" @click="triggerUpload">
              Upload file
            </v-btn>
          </div>
        </div>

        <input ref="fileInput" type="file" class="d-none" multiple @change="onFileSelected">

        <div class="d-flex flex-wrap align-center ga-2">
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
      </v-card>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <v-row>
        <v-col cols="12" md="4" lg="3">
          <v-card rounded="xl" class="pa-3 library-pane h-100" elevation="0">
            <h2 class="text-subtitle-1 font-weight-bold mb-3">Folders</h2>
            <v-skeleton-loader v-if="isLoading" type="list-item-two-line@5" />
            <v-list v-else class="bg-transparent py-0 library-tree" density="compact" nav>
              <v-list-item
                v-for="item in folderFlatItems"
                :key="item.id ?? 'root'"
                :active="(item.id ?? null) === currentFolderId"
                rounded="lg"
                @click="openFolder(item.id ?? null)"
              >
                <template #prepend>
                  <v-icon icon="mdi-folder-outline" color="warning" />
                </template>
                <v-list-item-title :style="{ paddingLeft: `${item.depth * 10}px` }">{{ item.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="8" lg="9">
          <v-card rounded="xl" class="pa-4 library-pane" elevation="0">
            <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
              <div>
                <h2 class="text-h6 font-weight-bold mb-1">{{ currentFolder.name }}</h2>
                <p class="text-body-2 text-medium-emphasis mb-0">{{ displayedItems.length }} item(s)</p>
              </div>
              <div class="d-flex ga-2 align-center">
                <v-btn variant="text" prepend-icon="mdi-arrow-up" :disabled="breadcrumb.length <= 1" @click="openParent">Parent folder</v-btn>
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Search in current folder"
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
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in displayedItems"
                  :key="item.id"
                  class="library-row"
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
                  <td>
                    {{ item.type === 'folder' ? 'Folder' : (item.mimeType || item.fileType || 'File') }}
                  </td>
                  <td>
                    {{ item.type === 'folder' ? '—' : formatBytes(item.size) }}
                  </td>
                </tr>
                <tr v-if="!displayedItems.length">
                  <td colspan="3" class="text-medium-emphasis py-8 text-center">
                    Ce dossier est vide. Ajoutez un dossier ou un fichier pour commencer.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>

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
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.library-page {
  min-height: 100%;
}

.library-header,
.library-pane {
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-primary), 0.03) 100%);
}

.library-tree {
  max-height: 60vh;
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
</style>
