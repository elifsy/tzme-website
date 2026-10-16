import { inject, onBeforeUnmount, shallowRef, unref } from 'vue'

export const adminEditorKey = Symbol('admin-editor-state')
export const createAdminEditorState = () => shallowRef(null)
export function useAdminEditorState(state) {
  const current = inject(adminEditorKey, null)
  if (!current) return
  const owner = { get dirty() { return !unref(state.loading) && Boolean(unref(state.dirty)) }, get busy() { return Boolean(unref(state.saving) || unref(state.uploading)) } }
  current.value = owner
  onBeforeUnmount(() => { if (current.value === owner) current.value = null })
}
