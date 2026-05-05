import type { INestApplication } from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { App } from 'supertest/types'

import { AppController } from './../src/app.controller'
import { AppService } from './../src/app.service'
import { HttpExceptionFilter } from './../src/common/http/http-exception.filter'
import { ResponseInterceptor } from './../src/common/http/response.interceptor'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect({
      code: 0,
      data: 'Hello World!',
      errMsg: '',
    })
  })
})
