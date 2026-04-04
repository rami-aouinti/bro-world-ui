import { expect, test } from '@playwright/test'

test.describe('Sport segmented navigation', () => {
  test('Games -> request today, Teams -> request teams, Players -> request players, fallback on API error', async ({ page }) => {
    const todayRequests: string[] = []
    const teamsRequests: string[] = []
    const playersRequests: string[] = []

    await page.route('**/api/sport/football/games/today**', async (route) => {
      todayRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sport: 'football',
          date: '2026-01-01',
          timezonePolicy: 'UTC',
          games: [],
        }),
      })
    })

    await page.route('**/api/apisports/football/teams**', async (route) => {
      teamsRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: [
            {
              team: {
                id: 1,
                name: 'Paris Saint-Germain',
                logo: '',
                country: 'France',
              },
            },
          ],
        }),
      })
    })

    await page.route('**/api/apisports/football/players**', async (route) => {
      playersRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: [
            {
              player: {
                id: 10,
                name: 'Kylian Mbappé',
              },
              statistics: [
                {
                  team: { name: 'Paris Saint-Germain' },
                  league: { name: 'Ligue 1' },
                  games: { position: 'Attacker', appearences: 10 },
                  goals: { total: 8, assists: 2 },
                },
              ],
            },
          ],
          paging: { current: 1, total: 1 },
        }),
      })
    })

    await page.goto('/sport/football/games')

    await expect(page.getByTestId('sport-tab-games')).toBeVisible()
    await expect.poll(() => todayRequests.length).toBeGreaterThan(0)

    await page.getByTestId('sport-tab-teams').click()
    await expect(page).toHaveURL(/\/sport\/football\/teams/)
    await expect.poll(() => teamsRequests.length).toBeGreaterThan(0)

    await page.getByTestId('sport-tab-players').click()
    await expect(page).toHaveURL(/\/sport\/football\/players/)
    await expect.poll(() => playersRequests.length).toBeGreaterThan(0)

    await page.unroute('**/api/sport/football/games/today**')
    await page.route('**/api/sport/football/games/today**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Boom' }),
      })
    })

    await page.getByTestId('sport-tab-games').click()
    await expect(page).toHaveURL(/\/sport\/football\/games/)
    await expect(page.getByText('Unable to load games.')).toBeVisible()
  })
})
