export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-standard-vue/scss',
    'stylelint-config-recess-order',
  ],
  plugins: ['stylelint-scss'],
  rules: {
    'at-rule-no-unknown': null,
    'color-function-notation': null,
    'declaration-property-value-no-unknown': null,
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['v-bind', 'map-get', 'lighten', 'darken', 'constant'],
      },
    ],
    'font-family-no-missing-generic-family-keyword': null,
    'no-descending-specificity': null,
    'property-no-unknown': null,
    'selector-class-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep'],
      },
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['/^view-transition/', 'v-deep'],
      },
    ],
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['/^uni-/', 'page', 'radio', 'checkbox', 'scroll-view'],
      },
    ],
    'scss/double-slash-comment-empty-line-before': null,
    'scss/at-if-closing-brace-newline-after': null,
    'scss/at-if-closing-brace-space-after': null,
    'scss/no-global-function-names': null,
    'unit-no-unknown': [
      true,
      {
        ignoreUnits: ['rpx'],
      },
    ],
  },
  allowEmptyInput: true,
  ignoreFiles: [
    'node_modules/**/*',
    '**/dist/**',
    'dist*/**/*',
    'apps/admin/public/tinymce/**/*',
    'apps/admin/src/iconify/*.json',
    'apps/admin/src/views/example/**/*',
    'apps/admin/src/views/plugin_example/**/*',
  ],
  overrides: [
    {
      files: ['apps/uniapp/**/*.{vue,scss,css}'],
      rules: {
        'color-function-alias-notation': null,
        'declaration-block-no-redundant-longhand-properties': null,
        'order/properties-order': null,
        'rule-empty-line-before': null,
        'scss/load-partial-extension': null,
      },
    },
  ],
}
