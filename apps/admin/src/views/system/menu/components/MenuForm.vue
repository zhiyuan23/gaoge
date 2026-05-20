<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

import type { SystemMenu } from '@/api/system/menu'

import { collectMenuBranchIds, formatParentOptions } from '../constants'
import type { SystemMenuFormModel } from '../model/types'
import { SYSTEM_MENU_STATUS_OPTIONS, SYSTEM_MENU_TYPE_OPTIONS } from '../schemas/search'

defineOptions({
  name: 'SystemMenuForm',
})

const props = defineProps<{
  mode: 'create' | 'edit'
  menuTree: SystemMenu[]
  currentId?: number | null
}>()

const model = defineModel<SystemMenuFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const parentOptions = computed(() => {
  const excludeIds = collectMenuBranchIds(props.menuTree, props.currentId)
  return formatParentOptions(props.menuTree, '', excludeIds)
})

const rules: FormRules<SystemMenuFormModel> = {
  name: [{ required: true, message: '请输入菜单标识', trigger: 'blur' }],
  title: [{ required: true, message: '请输入菜单标题', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
  routeName: [{ required: true, message: '请输入路由名', trigger: 'blur' }],
}

async function validate() {
  await formRef.value?.validate()
  return true
}

function reset() {
  formRef.value?.resetFields()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="rules" label-width="96px">
    <ElFormItem label="父级菜单" prop="parentId">
      <ElSelect v-model="model.parentId" class="w-full" clearable>
        <ElOption
          v-for="item in parentOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="菜单标识" prop="name">
      <ElInput v-model="model.name" placeholder="请输入菜单标识" />
    </ElFormItem>
    <ElFormItem label="菜单标题" prop="title">
      <ElInput v-model="model.title" placeholder="请输入菜单标题" />
    </ElFormItem>
    <ElFormItem label="图标" prop="icon">
      <ElInput v-model="model.icon" placeholder="可选" />
    </ElFormItem>
    <ElFormItem label="路径" prop="path">
      <ElInput v-model="model.path" placeholder="请输入路径" />
    </ElFormItem>
    <ElFormItem label="路由名" prop="routeName">
      <ElInput v-model="model.routeName" placeholder="请输入路由名" />
    </ElFormItem>
    <ElFormItem label="类型" prop="menuType">
      <ElSelect v-model="model.menuType" class="w-full">
        <ElOption
          v-for="item in SYSTEM_MENU_TYPE_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="排序" prop="sort">
      <ElInputNumber v-model="model.sort" :min="0" class="w-full" />
    </ElFormItem>
    <ElFormItem label="状态" prop="status">
      <ElSelect v-model="model.status" class="w-full">
        <ElOption
          v-for="item in SYSTEM_MENU_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="可见" prop="visible">
      <ElSwitch v-model="model.visible" />
    </ElFormItem>
  </ElForm>
</template>
