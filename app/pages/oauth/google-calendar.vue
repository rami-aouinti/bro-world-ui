<script setup lang="ts">
definePageMeta({
  layout: false,
})

if (import.meta.client) {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)

  const accessToken = hashParams.get('access_token') || ''
  const state = hashParams.get('state') || searchParams.get('state') || ''
  const error = hashParams.get('error') || searchParams.get('error') || ''

  window.opener?.postMessage({
    source: 'google-calendar-oauth',
    state,
    accessToken,
    error,
  }, window.location.origin)

  window.close()
}
</script>

<template>
  <div class="d-flex align-center justify-center fill-height pa-6 text-body-2 text-medium-emphasis">
    Google authorization in progress...
  </div>
</template>
