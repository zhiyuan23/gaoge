import { locationInfo } from '@/api'
import { Toast } from '@/utils'

/**
 * 自定义定位相关的错误类
 * 用于在定位流程中抛出结构化、可区分的错误，便于调用方针对不同场景做精确处理
 */
export class LocationError extends Error {
  constructor(
    message: string,
    public code: string, // 错误码，用于精确区分
    public details?: any, // 可选：额外数据，比如原始 err 对象
  ) {
    super(message)
    this.name = 'LocationError' // 方便 instanceof 判断和日志
  }
}

/**
 * 定位结果完整接口（包含逆解析信息）
 */
export interface LocationResult {
  lat: string
  lng: string
  province: {
    code: string
    name: string
  }
  city: {
    code: string
    name: string
  }
  district: {
    code: string
    name: string
  }
  adCode: string
  street: string
  fullAddress: string
}

/**
 * 获取位置参数接口
 */
interface LocationOptions {
  required?: boolean // 是否必须获取定位权限
  withReverse?: boolean // 是否进行逆地理编码
  onlyIfAuthorized?: boolean // 是否仅在已授权时获取
}

/**
 * 获取用户当前位置 + 可选逆地理编码
 * @param options - 定位配置对象
 * @returns Promise<LocationResult>
 */
export const useLocation = async (options: LocationOptions = {}): Promise<LocationResult> => {
  // 解构并设置默认值
  const { required = true, withReverse = true, onlyIfAuthorized = false } = options

  // 完整的默认空对象（所有字段都有默认值）
  const defaultEmpty: LocationResult = {
    lat: '',
    lng: '',
    province: { code: '', name: '' },
    city: { code: '', name: '' },
    district: { code: '', name: '' },
    adCode: '',
    street: '',
    fullAddress: '',
  }

  // 静默模式：检查是否已有权限，若无则直接返回空
  if (onlyIfAuthorized) {
    try {
      const setting: any = await uni.getSetting()
      // 如果没有授权记录，或者用户之前拒绝了权限，直接返回空，不触发任何系统弹窗
      if (!setting?.authSetting?.['scope.userLocation']) {
        return defaultEmpty
      }
    } catch {
      return defaultEmpty
    }
  }

  // 内部获取经纬度的函数
  const getBasicLocation = (): Promise<{ lat: string; lng: string }> =>
    new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: (res) =>
          resolve({
            lat: res.latitude.toString(),
            lng: res.longitude.toString(),
          }),
        fail: reject,
      })
    })

  let basic: { lat: string; lng: string } = { lat: '', lng: '' }

  try {
    basic = await getBasicLocation()
  } catch (err: any) {
    // 获取经纬度失败，非必填或静默模式下直接返回空
    if (!required || onlyIfAuthorized) {
      return defaultEmpty
    }

    const isAuthDenied =
      err.errMsg?.includes('auth') ||
      err.errMsg?.includes('deny') ||
      err.errMsg?.includes('authorize no response')

    if (!isAuthDenied) {
      Toast('获取位置失败，请检查定位服务')
      throw new LocationError('获取位置失败，请检查定位服务', 'LOCATION_SERVICE_ERROR', err)
    }

    // 必须权限：引导开启
    const confirm = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: '需要定位权限',
        content: '请开启定位权限后重试',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false),
      })
    })

    if (!confirm) {
      throw new LocationError('用户取消授权定位', 'USER_CANCELLED')
    }

    const settingRes = await new Promise<any | null>((resolve) => {
      uni.openSetting({
        success: resolve,
        fail: () => resolve(null),
      })
    })

    if (!settingRes?.authSetting?.['scope.userLocation']) {
      throw new LocationError('用户未开启定位权限', 'PERMISSION_NOT_GRANTED')
    }

    try {
      basic = await getBasicLocation()
    } catch (retryErr: any) {
      Toast('获取位置失败，请检查定位服务')
      throw new LocationError('重试获取定位失败', 'LOCATION_RETRY_FAILED', retryErr)
    }
  }

  if (!withReverse) {
    return {
      ...defaultEmpty,
      lat: basic.lat,
      lng: basic.lng,
    }
  }

  // 需要逆解析
  try {
    const res = await locationInfo({
      latitude: Number(basic.lat),
      longitude: Number(basic.lng),
    })

    return {
      lat: basic.lat,
      lng: basic.lng,
      province: {
        code: res.provinceId ?? '',
        name: res.provinceName ?? '',
      },
      city: {
        code: res.cityId ?? '',
        name: res.cityName ?? '',
      },
      district: {
        code: res.districtId ?? '',
        name: res.districtName ?? '',
      },
      adCode: res.adCode ?? '',
      street: res.regeocode?.addressComponent?.streetNumber?.street ?? '',
      fullAddress: res.regeocode?.formatted_address ?? '',
    }
  } catch (reverseErr) {
    if (onlyIfAuthorized) {
      return {
        ...defaultEmpty,
        lat: basic.lat,
        lng: basic.lng,
      }
    }

    throw new LocationError('获取城市信息失败', 'REVERSE_GEOCODE_FAILED', reverseErr)
  }
}
