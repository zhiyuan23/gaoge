import { BrandConfig } from '../../config/brand'
import { createPageReadyState } from '../../core/lifecycle'

Page({
  data: {
    ...createPageReadyState(),
    brandName: BrandConfig.appName,
    title: BrandConfig.fallbackTitle,
  },
  onLoad() {
    this.setData({
      ready: true,
    })
  },
})
