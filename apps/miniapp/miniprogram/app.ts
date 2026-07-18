import { initRuntime } from './core/runtime'

App({
  globalData: {
    launchTime: 0,
  },
  onLaunch() {
    this.globalData.launchTime = Date.now()
    initRuntime()
  },
})
