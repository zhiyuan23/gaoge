<route lang="yaml">
meta:
  enabled: false
</route>

<template>
  <div>
    <FaPageHeader title="右键菜单" description="FaContextMenu" />
    <FaPageMain>
      <FaContextMenu
        :items="[
          [
            { label: '菜单1-1' },
            { label: '菜单1-2', disabled: true },
            { label: '菜单1-3', icon: 'i-ep:edit' },
          ],
          [{ label: '菜单2' }],
        ]"
      >
        <div
          class="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm"
        >
          在这右键
        </div>
      </FaContextMenu>
    </FaPageMain>
  </div>
</template>
