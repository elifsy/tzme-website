<script setup>
import { inject, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { adminDialogSectionsKey } from "../composables/useAdminEditorState.js";

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  step: { type: String, default: "" },
});
const sections = inject(adminDialogSectionsKey, null);
const element = ref(null), id = `cms-editor-section-${useId()}`;
onMounted(() => sections?.register({ id, element: element.value, title: () => props.title }));
onBeforeUnmount(() => sections?.unregister(id));
</script>

<template>
  <section ref="element" :id="sections ? id : undefined" class="cms-editor-panel" :aria-labelledby="sections ? `${id}-title` : undefined">
    <div class="cms-panel-heading">
      <span v-if="step" class="cms-panel-step">{{ step }}</span>
      <div>
        <h3 :id="sections ? `${id}-title` : undefined">{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
    </div>
    <slot />
  </section>
</template>
