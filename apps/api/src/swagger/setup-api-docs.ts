import type { INestApplication } from '@nestjs/common'
import type { OpenAPIObject } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

export function setupApiDocs(app: INestApplication, document: OpenAPIObject) {
  app.use(
    '/api-docs',
    apiReference({
      content: document,
    }),
  )
}
