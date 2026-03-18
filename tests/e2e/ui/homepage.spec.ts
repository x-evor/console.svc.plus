import { expect, test } from '@playwright/test'

test.describe('Marketing homepage experience', () => {
  test('renders gateway-driven hero and switches language dynamically', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText(/状态面板|工作台|协作台|守望面板/)).toBeVisible()
    await expect(page.getByText('首屏状态')).toBeVisible()
    await expect(page.getByText('快速入口')).toBeVisible()
    await expect(page.getByText('平台统计')).toBeVisible()

    const languageToggle = page.getByRole('combobox')
    await languageToggle.selectOption('en')

    await expect(page.getByText(/Morning status board|Midday workspace|Evening workspace|Night watch panel/)).toBeVisible()
    await expect(page.getByText('Hero Status')).toBeVisible()
    await expect(page.getByText('Quick Access')).toBeVisible()
    await expect(page.getByText('Platform pulse')).toBeVisible()
  })
})
