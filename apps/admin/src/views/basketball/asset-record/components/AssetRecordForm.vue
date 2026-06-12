<script setup lang="ts">
import type { FormInstance } from 'element-plus'

import {
  getAssetRecordTypeOptions as getAssetRecordTypeOptionsByDirection,
  getDefaultRecordType,
} from '../model/defaults'
import type { AssetRecordFormModel } from '../model/types'
import {
  ASSET_RECORD_DIRECTION_OPTIONS,
  ASSET_RECORD_STATUS_OPTIONS,
  createAssetRecordFormRules,
  getAssetRecordTypeLabel,
  getAssetRecordTypeOptions,
} from '../schemas/form'

defineOptions({
  name: 'AssetRecordForm',
})

const model = defineModel<AssetRecordFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const formRules = computed(() => createAssetRecordFormRules(model.value))
const recordTypeOptions = computed(() => getAssetRecordTypeOptions(model.value.direction))
const showWaived = computed(
  () => model.value.direction === 'income' && model.value.recordType === 'match_fee',
)

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false)
  return Boolean(valid)
}

function reset() {
  formRef.value?.resetFields()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

watch(
  () => model.value.direction,
  (direction) => {
    const options = getAssetRecordTypeOptionsByDirection(direction)
    const isCurrentTypeValid = options.some((item) => item.value === model.value.recordType)

    if (!isCurrentTypeValid) {
      model.value.recordType = getDefaultRecordType(direction)
    }

    if (direction === 'expense') {
      model.value.isWaived = false
    }
  },
)

watch(
  () => model.value.recordType,
  (recordType) => {
    if (recordType !== 'match_fee') {
      model.value.isWaived = false
    }
  },
)

watch(
  () => model.value.isWaived,
  (isWaived) => {
    if (isWaived) {
      model.value.amount = 0
    } else if (model.value.amount === 0) {
      model.value.amount = null
    }
  },
)

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="formRules" label-width="96px" class="gaoge-form">
    <ElRow :gutter="16">
      <ElCol v-if="typeof model.id === 'number'" :span="12">
        <ElFormItem label="记录ID">
          <ElInput :model-value="String(model.id)" disabled />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="收支方向" prop="direction">
          <ElSelect v-model="model.direction" placeholder="请选择方向" class="w-full">
            <ElOption
              v-for="option in ASSET_RECORD_DIRECTION_OPTIONS"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="记录类型" prop="recordType">
          <ElSelect v-model="model.recordType" placeholder="请选择类型" class="w-full">
            <ElOption
              v-for="option in recordTypeOptions"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="金额（元）" prop="amount">
          <ElInputNumber
            v-model="model.amount"
            :min="0"
            :step="0.01"
            :precision="2"
            :disabled="model.isWaived"
            class="w-full"
          />
        </ElFormItem>
      </ElCol>
      <ElCol v-if="showWaived" :span="12">
        <ElFormItem label="免收场次">
          <ElSwitch v-model="model.isWaived" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="记录日期" prop="recordDate">
          <ElDatePicker
            v-model="model.recordDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择记录日期"
            class="w-full"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="状态" prop="status">
          <ElSelect v-model="model.status" placeholder="请选择状态" class="w-full">
            <ElOption
              v-for="option in ASSET_RECORD_STATUS_OPTIONS"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="赛季标签">
          <ElInput v-model="model.seasonLabel" placeholder="如：26赛季春季赛" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="场次标签">
          <ElInput
            v-model="model.matchLabel"
            :placeholder="model.recordType === 'match_fee' ? '如：第1场' : '可选填写'"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="标题" prop="title">
          <ElInput
            v-model="model.title"
            :placeholder="`请输入${getAssetRecordTypeLabel(model.recordType)}标题`"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="备注">
          <ElInput v-model="model.description" type="textarea" :rows="3" placeholder="请输入备注" />
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>
