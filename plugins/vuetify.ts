import { createVuetify } from "vuetify"
import * as components from "vuetify/components"
import * as directives from "vuetify/directives"

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({
        components,
        directives,
        theme: {
            defaultTheme: "light",
            themes: {
                light: {
                    dark: false,
                    colors: {
                        background: "#f8f9fa",
                        surface: "#ffffff",
                        "surface-bright": "#ffffff",
                        "surface-light": "#f8f9fa",
                        "surface-variant": "#f0f2f5",
                        primary: "#e91e63",
                        secondary: "#7b809a",
                        info: "#1a73e8",
                        success: "#4caf50",
                        warning: "#fb8c00",
                        error: "#f44335",
                        "on-background": "#344767",
                        "on-surface": "#344767",
                        "on-primary": "#ffffff",
                    },
                },
                dark: {
                    dark: true,
                    colors: {
                        background: "#111827",
                        surface: "#1f2937",
                        "surface-bright": "#334155",
                        "surface-light": "#1f2937",
                        "surface-variant": "#243044",
                        primary: "#ec407a",
                        secondary: "#9aa2bf",
                        info: "#49a3f1",
                        success: "#66bb6a",
                        warning: "#ffa726",
                        error: "#ef5350",
                        "on-background": "#f9fafb",
                        "on-surface": "#f9fafb",
                        "on-primary": "#ffffff",
                    },
                },
            },
        },
        defaults: {
            global: {
                ripple: true,
            },
            VCard: {
                rounded: "xl",
                elevation: 0,
            },
            VBtn: {
                rounded: "pill",
                variant: "flat",
                density: "comfortable",
            },
            VTextField: {
                rounded: "xl",
                variant: "outlined",
                density: "compact",
            },
            VChip: {
                rounded: "pill",
                density: "comfortable",
            },
            VMenu: {
                rounded: "xl",
            },
            VDialog: {
                rounded: "xl",
            },
            VSelect: {
                density: "compact",
            },
            VAutocomplete: {
                density: "compact",
            },
            VTextarea: {
                density: "comfortable",
            },
            VList: {
                density: "comfortable",
            },
            VListItem: {
                density: "comfortable",
            },
            VDataTable: {
                density: "comfortable",
            },
        },
    })

    nuxtApp.vueApp.use(vuetify)
})
