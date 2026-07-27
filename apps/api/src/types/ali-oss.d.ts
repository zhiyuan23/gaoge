declare module 'ali-oss' {
  type OssClientOptions = {
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    region: string
    secure?: boolean
  }

  type OssPutOptions = {
    headers?: Record<string, string>
  }

  class OSS {
    constructor(options: OssClientOptions)

    put(objectKey: string, content: Buffer, options?: OssPutOptions): Promise<unknown>

    delete(objectKey: string): Promise<unknown>
  }

  export default OSS
}
