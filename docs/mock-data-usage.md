# Cartographie de l’usage de `app/data/**`

- Périmètre scanné: `app/pages/**`, `app/composables/**`.
- Commande: `node scripts/map-mock-data-usage.mjs`.
- Total des fichiers consommateurs: 55.
- Total des modules `~/data/*` importés: 8.

## ~/data/platform-demo

- `app/pages/platform/[slug]/crm/admin.vue`
- `app/pages/platform/[slug]/crm/automation.vue`
- `app/pages/platform/[slug]/crm/billing.vue`
- `app/pages/platform/[slug]/crm/calendar.vue`
- `app/pages/platform/[slug]/crm/contacts.vue`
- `app/pages/platform/[slug]/crm/home.vue`
- `app/pages/platform/[slug]/crm/reports.vue`
- `app/pages/platform/[slug]/crm/settings.vue`
- `app/pages/platform/[slug]/crm/tickets.vue`
- `app/pages/platform/[slug]/recruit/admin.vue`
- `app/pages/platform/[slug]/school/admin.vue`
- `app/pages/platform/[slug]/school/certificates.vue`
- `app/pages/platform/[slug]/school/home.vue`
- `app/pages/platform/[slug]/school/settings.vue`
- `app/pages/platform/[slug]/school/students.vue`
- `app/pages/platform/[slug]/school/teachers.vue`
- `app/pages/platform/[slug]/school/tickets.vue`
- `app/pages/platform/[slug]/school/timetable.vue`
- `app/pages/platform/[slug]/shop/[category]/product/[productSlug].vue`
- `app/pages/platform/[slug]/shop/[category]/products.vue`
- `app/pages/platform/[slug]/shop/admin.vue`
- `app/pages/platform/[slug]/shop/checkout.vue`
- `app/pages/platform/[slug]/shop/home.vue`
- `app/pages/platform/[slug]/shop/payment.vue`
- `app/pages/platform/[slug]/shop/promotions.vue`
- `app/pages/platform/[slug]/shop/reviews.vue`
- `app/pages/platform/[slug]/shop/tickets.vue`

## ~/data/platform-enhanced

- `app/pages/platform/[slug]/crm/automation.vue`
- `app/pages/platform/[slug]/crm/contacts.vue`
- `app/pages/platform/[slug]/crm/home.vue`
- `app/pages/platform/[slug]/crm/reports.vue`
- `app/pages/platform/[slug]/crm/settings.vue`
- `app/pages/platform/[slug]/crm/tickets.vue`
- `app/pages/platform/[slug]/recruit/admin.vue`
- `app/pages/platform/[slug]/recruit/candidates.vue`
- `app/pages/platform/[slug]/recruit/interviews.vue`
- `app/pages/platform/[slug]/recruit/tickets.vue`
- `app/pages/platform/[slug]/school/settings.vue`
- `app/pages/platform/[slug]/school/students.vue`
- `app/pages/platform/[slug]/school/tickets.vue`
- `app/pages/platform/[slug]/school/timetable.vue`
- `app/pages/platform/[slug]/shop/home.vue`
- `app/pages/platform/[slug]/shop/payment.vue`
- `app/pages/platform/[slug]/shop/promotions.vue`
- `app/pages/platform/[slug]/shop/tickets.vue`

## ~/data/platform-nav

- `app/composables/platform/usePlatformPluginPage.ts`
- `app/pages/platform/[slug]/calendar.vue`
- `app/pages/platform/[slug]/crm/admin.vue`
- `app/pages/platform/[slug]/crm/automation.vue`
- `app/pages/platform/[slug]/crm/billing.vue`
- `app/pages/platform/[slug]/crm/calendar.vue`
- `app/pages/platform/[slug]/crm/companies.vue`
- `app/pages/platform/[slug]/crm/contacts.vue`
- `app/pages/platform/[slug]/crm/dashboard.vue`
- `app/pages/platform/[slug]/crm/home.vue`
- `app/pages/platform/[slug]/crm/projects.vue`
- `app/pages/platform/[slug]/crm/reports.vue`
- `app/pages/platform/[slug]/crm/settings.vue`
- `app/pages/platform/[slug]/crm/sprint.vue`
- `app/pages/platform/[slug]/crm/tickets.vue`
- `app/pages/platform/[slug]/recruit/admin.vue`
- `app/pages/platform/[slug]/recruit/candidates.vue`
- `app/pages/platform/[slug]/recruit/home.vue`
- `app/pages/platform/[slug]/recruit/interviews.vue`
- `app/pages/platform/[slug]/recruit/job/[jobSlug].vue`
- `app/pages/platform/[slug]/recruit/my-applications.vue`
- `app/pages/platform/[slug]/recruit/my-jobs.vue`
- `app/pages/platform/[slug]/recruit/new.vue`
- `app/pages/platform/[slug]/recruit/tickets.vue`
- `app/pages/platform/[slug]/school/admin.vue`
- `app/pages/platform/[slug]/school/certificates.vue`
- `app/pages/platform/[slug]/school/home.vue`
- `app/pages/platform/[slug]/school/settings.vue`
- `app/pages/platform/[slug]/school/students.vue`
- `app/pages/platform/[slug]/school/teachers.vue`
- `app/pages/platform/[slug]/school/tickets.vue`
- `app/pages/platform/[slug]/school/timetable.vue`
- `app/pages/platform/[slug]/shop/[category]/product/[productSlug].vue`
- `app/pages/platform/[slug]/shop/[category]/products.vue`
- `app/pages/platform/[slug]/shop/admin.vue`
- `app/pages/platform/[slug]/shop/checkout.vue`
- `app/pages/platform/[slug]/shop/customers.vue`
- `app/pages/platform/[slug]/shop/home.vue`
- `app/pages/platform/[slug]/shop/order-details/[orderId].vue`
- `app/pages/platform/[slug]/shop/orders.vue`
- `app/pages/platform/[slug]/shop/orders/[orderId].vue`
- `app/pages/platform/[slug]/shop/payment.vue`
- `app/pages/platform/[slug]/shop/products/[productSlug]/edit.vue`
- `app/pages/platform/[slug]/shop/products/new.vue`
- `app/pages/platform/[slug]/shop/promotions.vue`
- `app/pages/platform/[slug]/shop/reviews.vue`
- `app/pages/platform/[slug]/shop/tickets.vue`

## ~/data/platform/recruit

- `app/composables/recruit/useRecruitHome.ts`
- `app/pages/platform/[slug]/recruit/job/[jobSlug].vue`

## ~/data/settings-demo

- `app/pages/settings/accounts.vue`
- `app/pages/settings/basic-info.vue`
- `app/pages/settings/change-password.vue`
- `app/pages/settings/delete-account.vue`
- `app/pages/settings/notifications.vue`
- `app/pages/settings/sessions.vue`
- `app/pages/settings/two-factor.vue`

## ~/data/shop-admin-demo

- `app/pages/platform/[slug]/shop/products/[productSlug]/edit.vue`

## ~/data/shop-orders

- `app/pages/platform/[slug]/shop/orders.vue`
- `app/pages/platform/[slug]/shop/orders/[orderId].vue`

## ~/data/shop-product-detail

- `app/pages/platform/[slug]/shop/[category]/product/[productSlug].vue`
