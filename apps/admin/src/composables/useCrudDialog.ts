export type CrudDialogMode = 'create' | 'edit'

export interface UseCrudDialogOptions<Row> {
  cloneRow?: (row: Row) => Row
}

export function useCrudDialog<Row>(options: UseCrudDialogOptions<Row> = {}) {
  const dialogVisible = ref(false)
  const dialogMode = ref<CrudDialogMode>('create')
  const currentRow = ref<Row | null>(null)

  function openCreate() {
    dialogMode.value = 'create'
    currentRow.value = null
    dialogVisible.value = true
  }

  function openEdit(row: Row) {
    dialogMode.value = 'edit'
    currentRow.value = options.cloneRow ? options.cloneRow(row) : row
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
  }

  return {
    dialogVisible,
    dialogMode,
    currentRow,
    openCreate,
    openEdit,
    closeDialog,
  }
}
