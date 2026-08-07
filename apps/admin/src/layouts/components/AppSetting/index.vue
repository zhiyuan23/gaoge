<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { toast } from 'vue-sonner'

import settingsDefault from '@/settings.default'
import useMenuStore from '@/store/menu'
import useSettingsStore from '@/store/settings'
import eventBus from '@/utils/eventBus'
import { diffTwoObj } from '@/utils/object'

import type { Settings } from '#/global'

defineOptions({
  name: 'AppSetting',
})

const route = useRoute()

const settingsStore = useSettingsStore()
const menuStore = useMenuStore()

const isShow = ref(false)

watch(
  () => settingsStore.settings.menu.mode,
  (value) => {
    if (value === 'single') {
      menuStore.setActived(0)
    } else {
      menuStore.setActived(route.fullPath)
    }
  },
)

onMounted(() => {
  eventBus.on('global-app-setting-toggle', () => {
    isShow.value = !isShow.value
  })
})

const { copy, copied, isSupported } = useClipboard()

const colorSchemeOptions: Array<{
  icon: string
  label: string
  value: NonNullable<Settings.app['colorScheme']>
}> = [
  { icon: 'i-ri:sun-line', label: '明亮', value: 'light' },
  { icon: 'i-ri:moon-line', label: '暗黑', value: 'dark' },
  { icon: 'i-codicon:color-mode', label: '系统', value: '' },
]

const radiusOptions: Array<{ label: number; value: NonNullable<Settings.app['radius']> }> = [
  { label: 0, value: 0 },
  { label: 0.25, value: 0.25 },
  { label: 0.5, value: 0.5 },
  { label: 0.75, value: 0.75 },
  { label: 1, value: 1 },
]

const mainMenuClickModeOptions: Array<{
  label: string
  value: NonNullable<Settings.menu['mainMenuClickMode']>
}> = [
  { label: '切换', value: 'switch' },
  { label: '跳转', value: 'jump' },
  { label: '智能选择', value: 'smart' },
]

const topbarModeOptions: Array<{ label: string; value: NonNullable<Settings.topbar['mode']> }> = [
  { label: '静止', value: 'static' },
  { label: '固定', value: 'fixed' },
  { label: '粘性', value: 'sticky' },
]

watch(copied, (val) => {
  if (val) {
    toast.success('复制成功，请粘贴到 src/settings.ts 文件中！', {
      position: 'top-center',
    })
  }
})

function handleCopy() {
  copy(JSON.stringify(diffTwoObj(settingsDefault, settingsStore.settings), null, 2))
}
</script>

<template>
  <FaModal
    v-model="isShow"
    title="应用配置"
    description="在生产环境中应关闭该模块"
    :footer="isSupported"
    class="data-[state=closed]:zoom-out-92! data-[state=open]:zoom-in-92! data-[state=closed]:slide-out-to-top-0! data-[state=open]:slide-in-from-top-0! sm:max-w-4xl"
    content-class="bg-[var(--g-main-area-bg)] transition-background-color"
  >
    <div
      class="gap-4"
      :class="{
        'columns-1': settingsStore.mode === 'mobile',
        'columns-2': settingsStore.mode === 'pc',
      }"
    >
      <FaPageMain
        title="导航菜单"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div v-if="settingsStore.mode === 'pc'" class="menu-mode">
          <FaTooltip text="侧边栏模式 (含主导航)" :delay="500">
            <div
              class="mode mode-side"
              :class="{ active: settingsStore.settings.menu.mode === 'side' }"
              @click="settingsStore.settings.menu.mode = 'side'"
            >
              <div class="mode-container" />
            </div>
          </FaTooltip>
          <FaTooltip text="顶部模式" :delay="500">
            <div
              class="mode mode-head"
              :class="{ active: settingsStore.settings.menu.mode === 'head' }"
              @click="settingsStore.settings.menu.mode = 'head'"
            >
              <div class="mode-container" />
            </div>
          </FaTooltip>
          <FaTooltip text="侧边栏模式 (不含主导航)" :delay="500">
            <div
              class="mode mode-single"
              :class="{ active: settingsStore.settings.menu.mode === 'single' }"
              @click="settingsStore.settings.menu.mode = 'single'"
            >
              <div class="mode-container" />
            </div>
          </FaTooltip>
        </div>
        <div class="setting-item">
          <div class="label">
            主导航点击模式
            <FaTooltip text="智能选择会判断次导航是否只有且只有一个可访问的菜单进行切换或跳转操作">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <div class="setting-button-group">
            <FaButton
              v-for="(item, index) in mainMenuClickModeOptions"
              :key="index"
              :variant="
                settingsStore.settings.menu.mainMenuClickMode === item.value ? 'default' : 'outline'
              "
              size="sm"
              :class="{
                'z-1': settingsStore.settings.menu.mainMenuClickMode === item.value,
              }"
              @click="settingsStore.settings.menu.mainMenuClickMode = item.value"
            >
              {{ item.label }}
            </FaButton>
          </div>
        </div>
        <div class="setting-item">
          <div class="label">
            无主导航模式隐藏一级菜单
            <FaTooltip text="仅在侧边栏模式（无主导航）下生效">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch
            v-model="settingsStore.settings.menu.singleMenuHideFirstLevel"
            :disabled="settingsStore.settings.menu.mode !== 'single'"
          />
        </div>
        <div class="setting-item">
          <div class="label">
            次导航保持展开一个
            <FaTooltip text="开启该功能后，次导航只保持单个菜单的展开">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.menu.subMenuUniqueOpened" />
        </div>
        <div class="setting-item">
          <div class="label">次导航是否折叠</div>
          <FaSwitch v-model="settingsStore.settings.menu.subMenuCollapse" />
        </div>
        <div v-if="settingsStore.mode === 'pc'" class="setting-item">
          <div class="label">显示次导航折叠按钮</div>
          <FaSwitch v-model="settingsStore.settings.menu.enableSubMenuCollapseButton" />
        </div>
        <div class="setting-item">
          <div class="label">是否启用快捷键</div>
          <FaSwitch
            v-model="settingsStore.settings.menu.enableHotkeys"
            :disabled="['single'].includes(settingsStore.settings.menu.mode)"
          />
        </div>
      </FaPageMain>

      <FaPageMain
        title="顶栏"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div class="setting-item">
          <div class="label">模式</div>
          <div class="setting-button-group">
            <FaButton
              v-for="(item, index) in topbarModeOptions"
              :key="index"
              :variant="settingsStore.settings.topbar.mode === item.value ? 'default' : 'outline'"
              size="sm"
              :class="{ 'z-1': settingsStore.settings.topbar.mode === item.value }"
              @click="settingsStore.settings.topbar.mode = item.value"
            >
              {{ item.label }}
            </FaButton>
          </div>
        </div>
      </FaPageMain>

      <FaPageMain
        title="标签栏"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div class="setting-item">
          <div class="label">是否启用</div>
          <FaSwitch v-model="settingsStore.settings.tabbar.enable" />
        </div>
        <div class="setting-item">
          <div class="label">是否显示图标</div>
          <FaSwitch
            v-model="settingsStore.settings.tabbar.enableIcon"
            :disabled="!settingsStore.settings.tabbar.enable"
          />
        </div>
        <div class="setting-item">
          <div class="label">是否启用快捷键</div>
          <FaSwitch
            v-model="settingsStore.settings.tabbar.enableHotkeys"
            :disabled="!settingsStore.settings.tabbar.enable"
          />
        </div>
      </FaPageMain>

      <FaPageMain
        title="工具栏"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div v-if="settingsStore.mode === 'pc'" class="setting-item">
          <div class="label">面包屑导航</div>
          <FaSwitch v-model="settingsStore.settings.toolbar.breadcrumb" />
        </div>
        <div v-if="settingsStore.mode === 'pc'" class="setting-item">
          <div class="label">
            导航模式切换
            <FaTooltip text="开启后可在顶部工具栏快速切换顶部导航与无主导航模式">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.toolbar.menuModeSwitch" />
        </div>
        <div class="setting-item">
          <div class="label">
            导航搜索
            <FaTooltip text="对导航进行快捷搜索">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.toolbar.navSearch" />
        </div>
        <div class="setting-item">
          <div class="label">导航搜索快捷键</div>
          <FaSwitch
            v-model="settingsStore.settings.navSearch.enableHotkeys"
            :disabled="!settingsStore.settings.toolbar.navSearch"
          />
        </div>
        <div v-if="settingsStore.mode === 'pc'" class="setting-item">
          <div class="label">全屏</div>
          <FaSwitch v-model="settingsStore.settings.toolbar.fullscreen" />
        </div>
        <div class="setting-item">
          <div class="label">
            页面刷新
            <FaTooltip text="使用框架内提供的刷新功能进行页面刷新">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.toolbar.pageReload" />
        </div>
        <div class="setting-item">
          <div class="label">
            颜色主题
            <FaTooltip text="开启后可在明亮/暗黑模式中切换">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.toolbar.colorScheme" />
        </div>
      </FaPageMain>

      <FaPageMain
        title="主题"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div class="setting-item">
          <div class="label">颜色主题风格</div>
          <div class="setting-button-group">
            <FaButton
              v-for="item in colorSchemeOptions"
              :key="item.value"
              :variant="
                settingsStore.settings.app.colorScheme === item.value ? 'default' : 'outline'
              "
              size="sm"
              :class="{ 'z-1': settingsStore.settings.app.colorScheme === item.value }"
              @click="settingsStore.settings.app.colorScheme = item.value"
            >
              <FaIcon :name="item.icon" />
              {{ item.label }}
            </FaButton>
          </div>
        </div>
        <div class="setting-item">
          <div class="label">圆角系数</div>
          <div class="setting-button-group">
            <FaButton
              v-for="(item, index) in radiusOptions"
              :key="index"
              :variant="settingsStore.settings.app.radius === item.value ? 'default' : 'outline'"
              size="sm"
              class="w-12"
              :class="{ 'z-1': settingsStore.settings.app.radius === item.value }"
              @click="settingsStore.settings.app.radius = item.value"
            >
              {{ item.label }}
            </FaButton>
          </div>
        </div>
      </FaPageMain>

      <FaPageMain
        title="页面"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div class="setting-item">
          <div class="label">是否启用快捷键</div>
          <FaSwitch v-model="settingsStore.settings.mainPage.enableHotkeys" />
        </div>
        <div class="setting-item">
          <div class="label">
            载入进度条
            <FaTooltip text="该功能开启时，跳转路由会看到页面顶部有进度条">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.app.enableProgress" />
        </div>
      </FaPageMain>

      <FaPageMain
        title="应用"
        class="bg-secondary m-0 mb-4 break-inside-avoid"
        title-class="border-b-0 bg-secondary px-4 py-2.5 text-sm/4 font-bold text-muted-foreground"
        main-class="relative z-1 -mt-px space-y-4 rounded-t-lg border-t bg-card"
      >
        <div class="relative space-y-4 rounded-lg border p-4 pt-14">
          <div
            class="inset-s-0 inset-t-0 absolute rounded-ee-lg border-b border-e px-4 py-2 font-bold"
          >
            主页
          </div>
          <div class="setting-item">
            <div class="label">
              是否启用
              <FaTooltip
                text="该功能开启时，登录成功默认进入主页，反之则默认进入导航栏里第一个导航页面"
              >
                <FaIcon name="i-ri:question-line" />
              </FaTooltip>
            </div>
            <FaSwitch v-model="settingsStore.settings.home.enable" />
          </div>
          <div class="setting-item">
            <div class="label">
              主页名称
              <FaTooltip text="开启国际化时，该设置无效">
                <FaIcon name="i-ri:question-line" />
              </FaTooltip>
            </div>
            <FaInput v-model="settingsStore.settings.home.title" />
          </div>
        </div>
        <div class="relative space-y-4 rounded-lg border p-4 pt-14">
          <div
            class="inset-s-0 inset-t-0 absolute rounded-ee-lg border-b border-e px-4 py-2 font-bold"
          >
            版权
          </div>
          <div class="setting-item">
            <div class="label">是否启用</div>
            <FaSwitch v-model="settingsStore.settings.copyright.enable" />
          </div>
          <div class="setting-item">
            <div class="label">日期</div>
            <FaInput
              v-model="settingsStore.settings.copyright.dates"
              :disabled="!settingsStore.settings.copyright.enable"
            />
          </div>
          <div class="setting-item">
            <div class="label">公司</div>
            <FaInput
              v-model="settingsStore.settings.copyright.company"
              :disabled="!settingsStore.settings.copyright.enable"
            />
          </div>
          <div class="setting-item">
            <div class="label">网址</div>
            <FaInput
              v-model="settingsStore.settings.copyright.website"
              :disabled="!settingsStore.settings.copyright.enable"
            />
          </div>
          <div class="setting-item">
            <div class="label">备案</div>
            <FaInput
              v-model="settingsStore.settings.copyright.beian"
              :disabled="!settingsStore.settings.copyright.enable"
            />
          </div>
        </div>
        <div class="setting-item">
          <div class="label">是否启用权限</div>
          <FaSwitch v-model="settingsStore.settings.app.enablePermission" />
        </div>
        <div class="setting-item">
          <div class="label">
            哀悼模式
            <FaTooltip text="该功能开启时，整站会变为灰色">
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.app.enableMournMode" />
        </div>
        <div class="setting-item">
          <div class="label">色弱模式</div>
          <FaSwitch v-model="settingsStore.settings.app.enableColorAmblyopiaMode" />
        </div>
        <div class="setting-item">
          <div class="label">
            动态标题
            <FaTooltip
              text="该功能开启时，页面标题会显示当前路由标题，格式为“页面标题 - 网站名称”；关闭时则显示网站名称，网站名称在项目根目录下 .env.* 文件里配置"
            >
              <FaIcon name="i-ri:question-line" />
            </FaTooltip>
          </div>
          <FaSwitch v-model="settingsStore.settings.app.enableDynamicTitle" />
        </div>
      </FaPageMain>
    </div>
    <template #footer>
      <div class="w-full">
        <div class="bg-rose/20 c-rose mb-2 rounded-lg px-4 py-2 text-center text-sm/6">
          在此处调整配置只是临时生效，要想真正应用于项目，请点击「复制配置」按钮，并粘贴到
          <code
            class="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
          >
            src/settings.ts
          </code>
          文件中。
        </div>
        <FaButton class="w-full" @click="handleCopy">
          <FaIcon
            :name="copied ? 'i-tabler:clipboard-check' : 'i-tabler:clipboard'"
            class="size-5"
          />
          复制配置
        </FaButton>
      </div>
    </template>
  </FaModal>
</template>

<style scoped>
.menu-mode {
  --uno: flex items-center justify-center gap-4;

  .mode {
    --uno: relative w-16 h-12 rounded-2 ring-1 ring-border cursor-pointer transition;

    &.active {
      --uno: ring-primary ring-2;
    }

    &::before,
    &::after,
    .mode-container {
      --uno: absolute pointer-events-none;
    }

    &::before {
      --uno: content-empty bg-primary;
    }

    &::after {
      --uno: content-empty bg-primary/60;
    }

    .mode-container {
      --uno: bg-primary/20 border-width-1.5 border-dashed border-primary;

      &::before {
        --uno: content-empty absolute w-full h-full;
      }
    }

    &-side {
      &::before {
        --uno: top-2 bottom-2 left-2 w-2 rounded-tl-1 rounded-bl-1;
      }

      &::after {
        --uno: top-2 bottom-2 left-4.5 w-3;
      }

      .mode-container {
        --uno: inset-t-2 inset-r-2 inset-b-2 inset-l-8 rounded-tr-1 rounded-br-1;
      }
    }

    &-head {
      &::before {
        --uno: top-2 left-2 right-2 h-2 rounded-tl-1 rounded-tr-1;
      }

      &::after {
        --uno: top-4.5 left-2 bottom-2 w-3 rounded-bl-1;
      }

      .mode-container {
        --uno: inset-t-4.5 inset-r-2 inset-b-2 inset-l-5.5 rounded-br-1;
      }
    }

    &-single {
      &::after {
        --uno: top-2 left-2 bottom-2 w-3 rounded-tl-1 rounded-bl-1;
      }

      .mode-container {
        --uno: inset-t-2 inset-r-2 inset-b-2 inset-l-5.5 rounded-tr-1 rounded-br-1;
      }
    }
  }
}

.setting-button-group {
  --uno: inline-flex flex-shrink-0;

  :deep(button) {
    --uno: rounded-none;

    margin-inline-start: -1px;
  }

  :deep(button:first-child) {
    --uno: rounded-s-md;

    margin-inline-start: 0;
  }

  :deep(button:last-child) {
    --uno: rounded-e-md;
  }
}

.setting-item {
  --uno: flex items-center justify-between gap-4;

  .label {
    --uno: flex items-center flex-shrink-0 gap-2 text-sm;

    i {
      --uno: text-xl text-orange cursor-help;
    }
  }
}
</style>
