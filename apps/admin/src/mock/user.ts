import { faker } from '@faker-js/faker'
import { defineFakeRoute } from 'vite-plugin-fake-server/client'

export default defineFakeRoute([
  {
    url: '/mock/user/login',
    method: 'post',
    response: ({ body }) => {
      return {
        errMsg: '',
        code: 0,
        data: {
          account: body.account,
          token: `${body.account}:${faker.internet.jwt()}`,
          avatar: '',
        },
      }
    },
  },
  {
    url: '/mock/user/permission',
    method: 'get',
    response: ({ headers }) => {
      let permissions: string[] = []
      if (headers.token?.indexOf('admin') === 0) {
        permissions = [
          'permission.browse',
          'permission.create',
          'permission.edit',
          'permission.remove',
        ]
      } else if (headers.token?.indexOf('test') === 0) {
        permissions = ['permission.browse']
      }
      return {
        errMsg: '',
        code: 0,
        data: {
          permissions,
        },
      }
    },
  },
  {
    url: '/mock/user/password/edit',
    method: 'post',
    response: () => {
      return {
        errMsg: '',
        code: 0,
        data: {
          isSuccess: true,
        },
      }
    },
  },
])
