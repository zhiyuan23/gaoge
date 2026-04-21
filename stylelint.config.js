export default {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-standard-vue/scss',
    'stylelint-config-recess-order',
  ],
  plugins: ['stylelint-scss'],
  rules: {
    'at-rule-no-unknown': null,
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['v-bind', 'map-get', 'lighten', 'darken'],
      },
    ],
    'font-family-no-missing-generic-family-keyword': null,
    'no-descending-specificity': null,
    'property-no-unknown': null,
    'selector-class-pattern': null,
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['/^view-transition/'],
      },
    ],
    'scss/double-slash-comment-empty-line-before': null,
    'scss/at-if-closing-brace-newline-after': null,
    'scss/at-if-closing-brace-space-after': null,
    'scss/no-global-function-names': null,
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
}
