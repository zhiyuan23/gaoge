import { _electron as electron, expect, test } from '@playwright/test'

test('desktop shell boots and shows the Gaoge workspace', async () => {
  const app = await electron.launch({
    args: ['dist/main/index.js'],
  })

  const page = await app.firstWindow()

  await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Workspace placeholder' })).toBeVisible()

  await app.close()
})
