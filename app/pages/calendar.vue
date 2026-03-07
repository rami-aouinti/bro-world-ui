<script setup lang="ts">
definePageMeta({
  public: false,
  requiresAuth: true,
})
</script>

<template>
  <UiPageShell
    title="Calendar"
    eyebrow="Planification"
    icon="mdi-calendar-month-outline"
    subtitle="Visualisez les échéances à venir et préparez vos prochaines actions d'équipe."
    max-width="1200"
  >
    <CalendarView />
  </UiPageShell>
</template>
