/// <reference types="vite/client" />
interface ImportMetaEnv {
  // Auto generate by env-parse
  /**
   * API 通用前缀
   */
  readonly VITE_APP_API_PREFIX: string
  /**
   * 调试工具
   */
  readonly VITE_APP_DEBUG_TOOL: string
  /**
   * 禁用开发者工具（默认关闭）
   */
  readonly VITE_APP_DISABLE_DEVTOOL: boolean
  readonly VITE_APP_DOC_PREFIX: string
  readonly VITE_APP_IMAGE_PREFIX: string
  /**
   * 静态资源前缀
   */
  readonly VITE_APP_PDF_PREFIX: string
  /**
   * 应用配置面板
   */
  readonly VITE_APP_TITLE: string
  readonly VITE_BUILD_ARCHIVE: string
  readonly VITE_BUILD_COMPRESS: string
  /**
   * 构建配置（默认关闭）
   */
  readonly VITE_BUILD_MOCK: boolean
  readonly VITE_BUILD_SOURCEMAP: boolean
  /**
   * 服务端地址（开发用）
   */
  readonly VITE_APP_BASE_URL: string
  /**
   * ========================
   * 开发环境配置
   * ========================
   */
  readonly VITE_APP_SETTING: boolean
  readonly VITE_APP_STATIC_RESOURCE_URL: string
  /**
   * 是否开启开发者工具
   */
  readonly VITE_OPEN_DEVTOOLS: boolean
  /**
   * 是否开启代理
   */
  readonly VITE_OPEN_PROXY: boolean
}

declare module 'virtual:svg-icons-register'
