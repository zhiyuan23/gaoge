<route lang="yaml">
meta:
  title: 球员信息
</route>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { Player, PlayerPayload } from '@/api/modules/players'
import type { TableColumn } from '@/constants/modules/basic-data/types'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import playersApi from '@/api/modules/players'
import useUserStore from '@/store/modules/user'

defineOptions({
  name: 'GaogePlayer',
})

interface PlayerSearch {
  keyword: string
  subTeam: string
  position: string
  status: string
}

interface PlayerFormModel {
  id?: number
  openid: string
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  birthDate: string
  isAdmin: boolean
  position: string
  jerseySize: string
  status: string
  remark: string
}

const search = ref<PlayerSearch>({
  keyword: '',
  subTeam: '',
  position: '',
  status: '',
})

const columns = ref<TableColumn[]>([
  { label: '头像', prop: 'avatarUrl', width: 88, slot: 'avatar', align: 'center' },
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '真实姓名', prop: 'realName', width: 120 },
  { label: 'OpenID', prop: 'openid', width: 220 },
  { label: '分队', prop: 'subTeam', width: 120 },
  { label: '位置', prop: 'position', width: 120 },
  { label: '球衣尺码', prop: 'jerseySize', width: 110, align: 'center' },
  { label: '状态', prop: 'status', width: 110, slot: 'status', align: 'center' },
  { label: '管理员', prop: 'isAdmin', width: 100, slot: 'isAdmin', align: 'center' },
  { label: '生日', prop: 'birthDate', width: 120, slot: 'birthDate', align: 'center' },
  { label: '更新时间', prop: 'updatedAt', width: 170, slot: 'updatedAt' },
  { label: '备注', prop: 'remark', width: 180 },
  { label: '操作', prop: 'actions', width: 160, fixed: 'right', slot: 'actions', align: 'center' },
])
const userStore = useUserStore()

const playerData = ref<Player[]>([])
const loading = ref(false)
const submitLoading = ref(false)
const page = ref(1)
const pageSize = ref(15)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

const formModel = ref<PlayerFormModel>(createEmptyForm())

const formRules: FormRules<PlayerFormModel> = {
  openid: [{ required: true, message: '请输入 OpenID', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

const filteredData = computed(() => {
  const keyword = search.value.keyword.trim().toLowerCase()
  return playerData.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      [item.nickname, item.realName, item.openid, item.position, item.subTeam].some((value) =>
        value?.toLowerCase().includes(keyword),
      )
    const matchSubTeam = !search.value.subTeam || item.subTeam === search.value.subTeam
    const matchPosition = !search.value.position || item.position === search.value.position
    const matchStatus = !search.value.status || item.status === search.value.status
    return matchKeyword && matchSubTeam && matchPosition && matchStatus
  })
})

const total = computed(() => filteredData.value.length)

const tableData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const subTeamOptions = computed(() =>
  uniqueNonEmptyValues(playerData.value.map((item) => item.subTeam)),
)
const positionOptions = computed(() =>
  uniqueNonEmptyValues(playerData.value.map((item) => item.position)),
)
const statusOptions = computed(() =>
  uniqueNonEmptyValues(playerData.value.map((item) => item.status)),
)
const customStatusOptions = computed(() =>
  statusOptions.value.filter((item) => !['active', 'inactive'].includes(item)),
)
const canManagePlayers = computed(() => userStore.canManagePlayers)

function createEmptyForm(): PlayerFormModel {
  return {
    openid: '',
    nickname: '',
    realName: '',
    avatarUrl: '',
    subTeam: '',
    birthDate: '',
    isAdmin: false,
    position: '',
    jerseySize: '',
    status: 'active',
    remark: '',
  }
}

function uniqueNonEmptyValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim()))),
  )
}

function resetPage() {
  page.value = 1
}

function normalizeText(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

function formatBirthDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD')
}

function getStatusTagType(status: string) {
  if (status === 'active') {
    return 'success'
  }
  if (status === 'inactive') {
    return 'info'
  }
  return 'warning'
}

function getStatusLabel(status: string) {
  if (status === 'active') {
    return '正常'
  }
  if (status === 'inactive') {
    return '停用'
  }
  return status || '-'
}

function buildPayload(model: PlayerFormModel): PlayerPayload {
  return {
    openid: model.openid.trim(),
    nickname: model.nickname.trim(),
    realName: normalizeText(model.realName),
    avatarUrl: normalizeText(model.avatarUrl),
    subTeam: normalizeText(model.subTeam),
    birthDate: model.birthDate ? dayjs(model.birthDate).startOf('day').toISOString() : undefined,
    isAdmin: model.isAdmin,
    position: normalizeText(model.position),
    jerseySize: normalizeText(model.jerseySize),
    status: normalizeText(model.status) ?? 'active',
    remark: normalizeText(model.remark),
  }
}

function syncListItem(payload: Player) {
  const index = playerData.value.findIndex((item) => item.id === payload.id)
  if (index === -1) {
    playerData.value = [payload, ...playerData.value]
    return
  }
  playerData.value.splice(index, 1, payload)
  playerData.value = [...playerData.value]
}

function handleSearch() {
  resetPage()
}

function handleReset() {
  search.value = {
    keyword: '',
    subTeam: '',
    position: '',
    status: '',
  }
  resetPage()
}

function handleAdd() {
  if (!canManagePlayers.value) {
    ElMessage.warning('当前账号没有新增球员权限')
    return
  }
  dialogMode.value = 'create'
  formModel.value = createEmptyForm()
  dialogVisible.value = true
}

function handleEdit(row: Player) {
  if (!canManagePlayers.value) {
    ElMessage.warning('当前账号没有编辑球员权限')
    return
  }
  dialogMode.value = 'edit'
  formModel.value = {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname,
    realName: row.realName ?? '',
    avatarUrl: row.avatarUrl ?? '',
    subTeam: row.subTeam ?? '',
    birthDate: row.birthDate ? dayjs(row.birthDate).format('YYYY-MM-DD') : '',
    isAdmin: row.isAdmin,
    position: row.position ?? '',
    jerseySize: row.jerseySize ?? '',
    status: row.status ?? 'active',
    remark: row.remark ?? '',
  }
  dialogVisible.value = true
}

async function fetchPlayers() {
  loading.value = true
  try {
    playerData.value = await playersApi.list()
    if (page.value > 1 && (page.value - 1) * pageSize.value >= playerData.value.length) {
      page.value = Math.max(1, Math.ceil(playerData.value.length / pageSize.value))
    }
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: Player) {
  if (!canManagePlayers.value) {
    ElMessage.warning('当前账号没有删除球员权限')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除球员 ${row.nickname} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await playersApi.remove(row.id)
    playerData.value = playerData.value.filter((item) => item.id !== row.id)
    if (tableData.value.length === 1 && page.value > 1) {
      page.value -= 1
    }
    ElMessage.success('已删除')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!canManagePlayers.value) {
    ElMessage.warning('当前账号没有保存球员权限')
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  submitLoading.value = true
  try {
    const payload = buildPayload(formModel.value)
    if (dialogMode.value === 'create') {
      const created = await playersApi.create(payload)
      playerData.value = [created, ...playerData.value]
      ElMessage.success('新增成功')
    } else {
      const updated = await playersApi.update(formModel.value.id!, payload)
      syncListItem(updated)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    resetPage()
  } finally {
    submitLoading.value = false
  }
}

watch(dialogVisible, (visible) => {
  if (!visible) {
    formRef.value?.resetFields()
  }
})

onMounted(() => {
  fetchPlayers()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <FaSearchBar>
        <template #default>
          <ElForm :model="search" label-width="90px">
            <ElRow :gutter="16">
              <ElCol :span="8">
                <ElFormItem label="关键词">
                  <ElInput
                    v-model="search.keyword"
                    placeholder="昵称 / 姓名 / OpenID / 位置"
                    clearable
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="5">
                <ElFormItem label="分队">
                  <ElSelect v-model="search.subTeam" placeholder="全部" clearable filterable>
                    <ElOption
                      v-for="item in subTeamOptions"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="5">
                <ElFormItem label="位置">
                  <ElSelect v-model="search.position" placeholder="全部" clearable filterable>
                    <ElOption
                      v-for="item in positionOptions"
                      :key="item"
                      :label="item"
                      :value="item"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="状态">
                  <ElSelect v-model="search.status" placeholder="全部" clearable filterable>
                    <ElOption
                      v-for="item in statusOptions"
                      :key="item"
                      :label="getStatusLabel(item)"
                      :value="item"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElFormItem>
              <ElButton type="primary" @click="handleSearch">
                <template #icon>
                  <FaIcon name="i-ep:search" />
                </template>
                查询
              </ElButton>
              <ElButton @click="handleReset"> 重置 </ElButton>
              <ElButton v-if="canManagePlayers" type="primary" plain @click="handleAdd">
                新增球员
              </ElButton>
            </ElFormItem>
          </ElForm>
        </template>
      </FaSearchBar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="columns"
          :data="tableData"
          :total="total"
          :loading="loading"
          :show-index="true"
          table-height="100%"
        >
          <template #avatar="{ row }">
            <ElAvatar :src="row.avatarUrl || undefined" :size="32">
              {{ (row.nickname || '?').slice(0, 1) }}
            </ElAvatar>
          </template>
          <template #status="{ row }">
            <ElTag :type="getStatusTagType(row.status)" effect="light">
              {{ getStatusLabel(row.status) }}
            </ElTag>
          </template>
          <template #isAdmin="{ row }">
            <ElTag :type="row.isAdmin ? 'danger' : 'info'" effect="light">
              {{ row.isAdmin ? '是' : '否' }}
            </ElTag>
          </template>
          <template #birthDate="{ row }">
            {{ formatBirthDate(row.birthDate) }}
          </template>
          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
          <template #actions="{ row }">
            <div v-if="canManagePlayers" class="flex-center gap-2">
              <ElButton type="primary" link @click="handleEdit(row)"> 编辑 </ElButton>
              <ElButton type="danger" link @click="handleDelete(row)"> 删除 </ElButton>
            </div>
          </template>
        </EsTable>
      </div>
    </FaPageMain>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增球员' : '编辑球员'"
      width="640px"
    >
      <ElForm ref="formRef" :model="formModel" :rules="formRules" label-width="96px">
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="OpenID" prop="openid">
              <ElInput v-model="formModel.openid" placeholder="请输入 OpenID" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="昵称" prop="nickname">
              <ElInput v-model="formModel.nickname" placeholder="请输入昵称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="真实姓名">
              <ElInput v-model="formModel.realName" placeholder="请输入真实姓名" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="头像地址">
              <ElInput v-model="formModel.avatarUrl" placeholder="请输入头像 URL" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="分队">
              <ElSelect
                v-model="formModel.subTeam"
                placeholder="请输入或选择分队"
                clearable
                filterable
                allow-create
                default-first-option
              >
                <ElOption v-for="item in subTeamOptions" :key="item" :label="item" :value="item" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="位置">
              <ElSelect
                v-model="formModel.position"
                placeholder="请输入或选择位置"
                clearable
                filterable
                allow-create
                default-first-option
              >
                <ElOption v-for="item in positionOptions" :key="item" :label="item" :value="item" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="球衣尺码">
              <ElInput v-model="formModel.jerseySize" placeholder="例如 L / XL" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="状态">
              <ElSelect
                v-model="formModel.status"
                placeholder="请输入或选择状态"
                filterable
                allow-create
                default-first-option
              >
                <ElOption label="正常" value="active" />
                <ElOption label="停用" value="inactive" />
                <ElOption
                  v-for="item in customStatusOptions"
                  :key="item"
                  :label="getStatusLabel(item)"
                  :value="item"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="出生日期">
              <ElDatePicker
                v-model="formModel.birthDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择出生日期"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="管理员">
              <ElSwitch v-model="formModel.isAdmin" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="24">
            <ElFormItem label="备注">
              <ElInput
                v-model="formModel.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false"> 取消 </ElButton>
        <ElButton type="primary" :loading="submitLoading" @click="handleSubmit"> 保存 </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.absolute-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  margin-top: 16px;
}
</style>
