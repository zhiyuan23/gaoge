<script setup lang="ts">
import type { FormInstance } from 'element-plus'

import {
  getPointsByRank,
  MATCH_ROUND_ROUND_OPTIONS,
  MATCH_ROUND_SEASON_OPTIONS,
  MATCH_ROUND_VENUE_OPTIONS,
} from '../model/defaults'
import type { MatchRoundFormModel } from '../model/types'
import { MATCH_ROUND_FORM_RULES, MATCH_ROUND_RANK_OPTIONS } from '../schemas/form'

defineOptions({
  name: 'MatchRoundForm',
})

const props = defineProps<{
  teamsValid: boolean
  teamsWarning: string
}>()

const model = defineModel<MatchRoundFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

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

function handleRankChange(index: number, value: 1 | 2 | 3 | null) {
  model.value.results[index].points = getPointsByRank(value)
  formRef.value?.validateField('results').catch(() => undefined)
}

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>

<template>
  <ElForm
    ref="formRef"
    :model="model"
    :rules="MATCH_ROUND_FORM_RULES"
    label-width="96px"
    class="gaoge-form"
  >
    <ElRow :gutter="16">
      <ElCol :span="12">
        <ElFormItem label="赛季" prop="season">
          <ElSelect v-model="model.season" placeholder="请选择赛季" class="w-full">
            <ElOption
              v-for="option in MATCH_ROUND_SEASON_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="场次" prop="round">
          <ElSelect v-model="model.round" placeholder="请选择场次" class="w-full">
            <ElOption
              v-for="option in MATCH_ROUND_ROUND_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="比赛日期" prop="matchDate">
          <ElDatePicker
            v-model="model.matchDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择比赛日期"
            class="w-full"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="比赛场地">
          <ElSelect v-model="model.venue" placeholder="请选择比赛场地" class="w-full">
            <ElOption
              v-for="option in MATCH_ROUND_VENUE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="建设费收取">
          <ElSwitch
            v-model="model.collectTeamFee"
            inline-prompt
            active-text="收取"
            inactive-text="不收"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="备注">
          <ElInput v-model="model.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="比赛结果" prop="results">
          <div class="w-full">
            <ElAlert v-if="!props.teamsValid" :title="props.teamsWarning" type="error" show-icon />

            <div v-else class="result-list">
              <div v-for="(item, index) in model.results" :key="item.teamId" class="result-row">
                <div class="team-name">{{ item.teamName }}</div>
                <ElSelect
                  v-model="item.rank"
                  placeholder="请选择名次"
                  clearable
                  class="rank-select"
                  @change="handleRankChange(index, $event)"
                >
                  <ElOption
                    v-for="option in MATCH_ROUND_RANK_OPTIONS"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
                <ElTag type="info">{{ item.points ?? '-' }} 分</ElTag>
              </div>
            </div>
          </div>
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>

<style scoped>
.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.team-name {
  width: 60px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.rank-select {
  width: 160px;
}
</style>
