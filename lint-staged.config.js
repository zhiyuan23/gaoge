export default {
  '*.{js,mjs,cjs,ts,tsx,vue,json,md,yml,yaml}': [
    'prettier --write',
    'eslint --fix --no-warn-ignored',
  ],
  '*.{css,scss,vue}': ['stylelint --fix --allow-empty-input'],
}
