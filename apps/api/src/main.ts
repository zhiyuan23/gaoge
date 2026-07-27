import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { createCorsOptions } from './bootstrap/cors-options'
import { resolveListenOptions } from './bootstrap/listen-options'
import { HttpExceptionFilter } from './common/http/http-exception.filter'
import { ResponseInterceptor } from './common/http/response.interceptor'
import { resolveUploadRoot, uploadPublicPrefix } from './common/storage/upload-path'
import { setupApiDocs } from './swagger/setup-api-docs'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // 启用 CORS（跨域资源共享）
  app.enableCors(createCorsOptions())

  // Swagger 接口文档配置
  const config = new DocumentBuilder()
    .setTitle('高歌服务端 API 文档')
    .setDescription('高歌项目后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  setupApiDocs(app, document)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useStaticAssets(resolveUploadRoot(), {
    prefix: `${uploadPublicPrefix}/`,
  })

  const listenOptions = resolveListenOptions()

  await app.listen(listenOptions.port, listenOptions.host)
}
bootstrap()
