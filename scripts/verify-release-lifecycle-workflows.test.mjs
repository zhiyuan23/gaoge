import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const workflows = {
  admin: await readFile('.github/workflows/deploy-admin.yml', 'utf8'),
  api: await readFile('.github/workflows/deploy-api.yml', 'utf8'),
  brand: await readFile('.github/workflows/deploy-brand.yml', 'utf8'),
  sports: await readFile('.github/workflows/deploy-sports.yml', 'utf8'),
}

function assertInOrder(source, fragments) {
  let previous = -1
  for (const fragment of fragments) {
    const index = source.indexOf(fragment, previous + 1)
    assert.notEqual(index, -1, `missing workflow fragment: ${fragment}`)
    assert.ok(index > previous, `workflow fragment is out of order: ${fragment}`)
    previous = index
  }
}

test('all main production workflows use one non-cancelling deployment queue and immutable run IDs', () => {
  for (const [name, workflow] of Object.entries(workflows)) {
    assert.match(workflow, /group: gaoge-production-deployment/, name)
    assert.match(workflow, /cancel-in-progress: false/, name)
    assert.match(
      workflow,
      /RELEASE_ID: \$\{\{ github\.sha \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/,
      name,
    )
    assert.match(workflow, /sudo -n \/usr\/local\/sbin\/gaoge-release-manager preflight/, name)
    assert.match(workflow, /sudo -n \/usr\/local\/sbin\/gaoge-release-manager register-start/, name)
    assert.match(workflow, /sudo -n \/usr\/local\/sbin\/gaoge-release-manager activate/, name)
    assert.match(workflow, /sudo -n \/usr\/local\/sbin\/gaoge-release-manager mark-success/, name)
    assert.match(workflow, /sudo -n \/usr\/local\/sbin\/gaoge-release-manager prune/, name)
    assert.match(workflow, /--max-delete 1/, name)
    assert.doesNotMatch(workflow, /rm -rf [^\n]*\/current/, name)
  }
})

test('static workflows gate upload, rollback a failed switch and keep maintenance non-fatal', () => {
  for (const name of ['admin', 'brand', 'sports']) {
    const workflow = workflows[name]
    assertInOrder(workflow, [
      'gaoge-release-manager preflight',
      'gaoge-release-manager register-start',
      'mkdir',
      'rsync',
      'gaoge-release-manager activate',
      '健康检查',
      'gaoge-release-manager mark-success',
      'gaoge-release-manager prune',
    ])
    assert.match(workflow, /id: switch-release/, name)
    assert.match(workflow, /steps\.switch-release\.outcome == 'success'/, name)
    assert.match(workflow, /gaoge-release-manager rollback/, name)
    assert.match(workflow, /::warning::.*lifecycle/, name)
    assert.match(workflow, /RELEASE_DIR=.*\$RELEASE_ID/, name)
    assert.match(workflow, /\[ ! -e \\"\\\$RELEASE_DIR\\" \]/, name)
  }
})

test('API uses immutable release IDs, preserves rollback ordering and expires state after 24 hours', () => {
  const workflow = workflows.api
  assertInOrder(workflow, [
    'gaoge-release-manager preflight',
    'gaoge-release-manager register-start',
    '保存发布回滚状态',
    '解压 API 发布包',
    'gaoge-release-manager activate',
    '运行 API 运行时守卫',
    '保存已验证的 PM2 状态',
    'gaoge-release-manager mark-success',
    'gaoge-release-manager prune',
    '发布失败时恢复 API 版本与环境',
    'gaoge-release-manager mark-failed',
  ])
  assert.match(workflow, /-mmin \+1440/)
  assert.match(workflow, /EXPECTED_RELEASE_PATH=.*RELEASE_ID/)
  assert.doesNotMatch(workflow, /RELEASE_DIR=.*github\.sha/)
  assert.match(workflow, /\[ ! -e \\"\\\$RELEASE_DIR\\" \]/)
  assert.doesNotMatch(workflow, /rm -rf \\"\\\$RELEASE_DIR\\"/)
  assert.match(workflow, /id: rollback-release/)
  assert.match(workflow, /steps\.rollback-release\.outcome == 'success'/)
})
