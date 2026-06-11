# Miniapp Message Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the miniapp message board end to end, including a shared contract, API resource and public feed, admin CRUD management, and the renamed miniapp tab page with tag-based filtering.

**Architecture:** Add a dedicated `content/message-board-post` resource in `apps/api` backed by a new Prisma model and shared DTO types in `packages/shared/types`. Expose two API surfaces: admin CRUD under `/content/message-board-posts` and a miniapp read-only feed under `/miniapp/message-board-posts`. Wire admin to the standard CRUD page skeleton and replace the miniapp placeholder `pages/message` page with a `pages/message-board` feed page that consumes the public API.

**Tech Stack:** Prisma, NestJS, Jest, Vue 3 + Element Plus admin, uni-app + Vue 3 miniapp, UnoCSS, shared workspace package `@gaoge/shared-types`

---

### Task 1: Shared Contract And Data Model

**Files:**

- Modify: `packages/shared/types/src/index.ts`
- Create: `packages/shared/types/src/message-board-post.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260610120000_add_message_board_post/migration.sql`

- [ ] **Step 1: Add the shared message-board types**

Create `packages/shared/types/src/message-board-post.ts` with:

```ts
import type { DateTimeString } from './common.js'

export type MessageBoardPostStatus = 'draft' | 'published'

export interface MessageBoardPost {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  status: MessageBoardPostStatus
  isPinned: boolean
  publishedAt: DateTimeString | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface MessageBoardPostPayload {
  title: string
  content: string
  tags?: string[]
  sourceName: string
  sourceUrl?: string
  status?: MessageBoardPostStatus
  isPinned?: boolean
}

export interface MessageBoardPostListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: MessageBoardPostStatus | ''
  tag?: string
}

export interface MessageBoardPostListResponse {
  list: MessageBoardPost[]
  total: number
  tagOptions: MessageBoardTagOption[]
}

export interface MiniappMessageBoardPostItem {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  isPinned: boolean
  publishedAt: DateTimeString
}

export interface MiniappMessageBoardListParams {
  page?: number
  pageSize?: number
  tag?: string
}

export interface MiniappMessageBoardListResponse {
  list: MiniappMessageBoardPostItem[]
  total: number
  tagOptions: MessageBoardTagOption[]
}

export interface MessageBoardTagOption {
  label: string
  value: string
}
```

- [ ] **Step 2: Export the new shared types**

Update `packages/shared/types/src/index.ts`:

```ts
export type * from './message-board-post.js'
```

- [ ] **Step 3: Add the Prisma model**

Append to `apps/api/prisma/schema.prisma`:

```prisma
model MessageBoardPost {
  id          Int      @id @default(autoincrement())
  title       String
  content     String
  tags        String[]
  sourceName  String
  sourceUrl   String?
  status      String   @default("draft")
  isPinned    Boolean  @default(false)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([isPinned])
  @@index([publishedAt])
}
```

- [ ] **Step 4: Add the migration SQL**

Create `apps/api/prisma/migrations/20260610120000_add_message_board_post/migration.sql` with:

```sql
CREATE TABLE "MessageBoardPost" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MessageBoardPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MessageBoardPost_status_idx" ON "MessageBoardPost"("status");
CREATE INDEX "MessageBoardPost_isPinned_idx" ON "MessageBoardPost"("isPinned");
CREATE INDEX "MessageBoardPost_publishedAt_idx" ON "MessageBoardPost"("publishedAt");
```

- [ ] **Step 5: Verify the shared package and Prisma schema compile**

Run: `pnpm --filter @gaoge/app-api typecheck`

Expected: command reaches TypeScript compilation and does not fail on missing message-board types or Prisma model references.

### Task 2: API Module, Public Feed, And Red-Green Tests

**Files:**

- Create: `apps/api/src/modules/content/content.module.ts`
- Create: `apps/api/src/modules/content/message-board-post/message-board-post.module.ts`
- Create: `apps/api/src/modules/content/message-board-post/message-board-post.controller.ts`
- Create: `apps/api/src/modules/content/message-board-post/message-board-post.service.ts`
- Create: `apps/api/src/modules/content/message-board-post/message-board-post.service.spec.ts`
- Create: `apps/api/src/modules/content/message-board-post/dto/create-message-board-post.dto.ts`
- Create: `apps/api/src/modules/content/message-board-post/dto/update-message-board-post.dto.ts`
- Create: `apps/api/src/modules/content/message-board-post/dto/message-board-post-list.dto.ts`
- Create: `apps/api/src/modules/miniapp/miniapp-public.controller.ts`
- Modify: `apps/api/src/modules/miniapp/miniapp.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/modules/system/rbac/builtins.ts`

- [ ] **Step 1: Write the failing service tests first**

Create `apps/api/src/modules/content/message-board-post/message-board-post.service.spec.ts` to cover:

```ts
it('publishes a draft and writes publishedAt once', async () => {})
it('filters admin list by keyword status and tag', async () => {})
it('returns only published records for miniapp feed', async () => {})
it('sorts miniapp feed by isPinned then publishedAt then id', async () => {})
it('builds deduplicated tag options from published items', async () => {})
```

- [ ] **Step 2: Run the new spec and confirm RED**

Run: `pnpm --filter @gaoge/app-api test -- message-board-post.service.spec.ts`

Expected: FAIL because the service and module do not exist yet.

- [ ] **Step 3: Implement the message-board module**

Build a focused NestJS resource:

```ts
@Controller('content/message-board-posts')
export class MessageBoardPostController {
  @Get()
  findAll(@Query() query: MessageBoardPostListDto) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Post()
  create(@Body() dto: CreateMessageBoardPostDto) {}

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMessageBoardPostDto) {}

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {}

  @Post(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number) {}
}
```

Service responsibilities:

```ts
create(dto)
findAll(params)
findOne(id)
update(id, dto)
remove(id)
publish(id)
findPublishedForMiniapp(params)
listTagOptions(scope)
```

Behavior requirements:

- normalize `page` and `pageSize`
- admin list defaults to `updatedAt desc`
- miniapp feed filters `status = 'published'`
- miniapp order is `[{ isPinned: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }]`
- `publish()` sets `status = 'published'` and writes `publishedAt` if currently null
- editing a published post keeps its current `publishedAt`

- [ ] **Step 4: Add DTO validation and query helpers**

DTOs must validate:

- `title`, `content`, `sourceName` required strings
- `tags` optional string array
- `sourceUrl` optional URL string
- `isPinned` optional boolean
- `status` optional enum `draft | published`
- list DTO supports `page`, `pageSize`, `keyword`, `status`, `tag`

- [ ] **Step 5: Expose the public miniapp feed**

Create `apps/api/src/modules/miniapp/miniapp-public.controller.ts`:

```ts
@Controller('miniapp')
export class MiniappPublicController {
  constructor(private readonly messageBoardPostService: MessageBoardPostService) {}

  @Get('message-board-posts')
  listMessageBoardPosts(@Query() query: MessageBoardPostListDto) {
    return this.messageBoardPostService.findPublishedForMiniapp(query)
  }
}
```

Update `MiniappModule` to include `MiniappPublicController` and provide/import `MessageBoardPostModule`.

- [ ] **Step 6: Register the content module and RBAC built-ins**

Update:

- `apps/api/src/app.module.ts` to import `ContentModule`
- `apps/api/src/modules/system/rbac/builtins.ts` to add:

```ts
moduleLabels.content = '内容'
resourceLabels.messageBoardPost = '留言板消息'
content.messageBoardPost.view
content.messageBoardPost.create
content.messageBoardPost.update
content.messageBoardPost.delete
content.messageBoardPost.publish
```

Also add built-in menu metadata for `/content/message-board-post`.

- [ ] **Step 7: Run the API spec again and confirm GREEN**

Run: `pnpm --filter @gaoge/app-api test -- message-board-post.service.spec.ts`

Expected: PASS with all new message-board service tests green.

### Task 3: Admin CRUD Integration

**Files:**

- Create: `apps/admin/src/api/content/message-board-post/index.ts`
- Create: `apps/admin/src/router/modules/content/index.ts`
- Create: `apps/admin/src/views/content/message-board-post/index.vue`
- Create: `apps/admin/src/views/content/message-board-post/auth.ts`
- Create: `apps/admin/src/views/content/message-board-post/components/MessageBoardPostForm.vue`
- Create: `apps/admin/src/views/content/message-board-post/components/MessageBoardPostFormDialog.vue`
- Create: `apps/admin/src/views/content/message-board-post/model/defaults.ts`
- Create: `apps/admin/src/views/content/message-board-post/model/mapper.ts`
- Create: `apps/admin/src/views/content/message-board-post/model/types.ts`
- Create: `apps/admin/src/views/content/message-board-post/schemas/form.ts`
- Create: `apps/admin/src/views/content/message-board-post/schemas/search.ts`
- Create: `apps/admin/src/views/content/message-board-post/schemas/table.ts`
- Modify: `apps/admin/src/router/routes.ts`

- [ ] **Step 1: Add the admin API client**

Create `apps/admin/src/api/content/message-board-post/index.ts`:

```ts
import type {
  MessageBoardPost,
  MessageBoardPostListParams,
  MessageBoardPostListResponse,
  MessageBoardPostPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export default {
  list: (params?: MessageBoardPostListParams) =>
    api.get<MessageBoardPostListResponse>('/content/message-board-posts', { params }),
  create: (data: MessageBoardPostPayload) =>
    api.post<MessageBoardPost>('/content/message-board-posts', data),
  update: (id: number, data: MessageBoardPostPayload) =>
    api.patch<MessageBoardPost>(`/content/message-board-posts/${id}`, data),
  remove: (id: number) => api.delete(`/content/message-board-posts/${id}`),
  publish: (id: number) => api.post<MessageBoardPost>(`/content/message-board-posts/${id}/publish`),
}
```

- [ ] **Step 2: Build the standard CRUD page structure**

Follow `useListPage + EsSearch + EsTable + EsListToolbar + useCrudDialog`.

Search fields:

- keyword
- status
- tag

Table columns:

- title
- tags
- source
- status
- pinned
- publishedAt
- updatedAt
- actions

- [ ] **Step 3: Implement the form dialog with `destroy-on-close`**

The dialog must provide:

- create mode buttons: `保存草稿`, `发布`
- edit mode button: `保存`
- optional source URL
- tag multi-entry using current admin component primitives

- [ ] **Step 4: Wire the content route group**

Create `apps/admin/src/router/modules/content/index.ts` and register it inside the main async route tree in `apps/admin/src/router/routes.ts`.

Route target:

```ts
{
  path: '/content',
  name: 'content',
  meta: { title: '内容管理', icon: 'ri:article-line' },
  children: [
    {
      path: 'message-board',
      name: 'contentMessageBoardPost',
      component: () => import('@/views/content/message-board-post/index.vue'),
      meta: { title: '留言板', auth: ['content.messageBoardPost.view'] },
    },
  ],
}
```

- [ ] **Step 5: Verify admin typing after the new module lands**

Run: `pnpm --filter @gaoge/app-admin typecheck`

Expected: PASS with the new route, page module, and API client types resolved.

### Task 4: Miniapp Page Rename And Feed UI

**Files:**

- Delete/rename: `apps/miniapp/src/pages/message/index.vue` -> `apps/miniapp/src/pages/message-board/index.vue`
- Create: `apps/miniapp/src/api/message-board-post/index.ts`
- Modify: `apps/miniapp/src/pages.json`

- [ ] **Step 1: Add the miniapp API client**

Create `apps/miniapp/src/api/message-board-post/index.ts`:

```ts
import type {
  MiniappMessageBoardListParams,
  MiniappMessageBoardListResponse,
} from '@gaoge/shared-types'
import api from '@/api/request'

export const requestMessageBoardPosts = (params?: MiniappMessageBoardListParams) =>
  api.get<MiniappMessageBoardListResponse>('/miniapp/message-board-posts', params, {
    skipAuth: true,
  })
```

- [ ] **Step 2: Rename the page path**

Update `apps/miniapp/src/pages.json`:

- `pages/message/index` -> `pages/message-board/index`
- tabbar `pagePath` -> `pages/message-board/index`
- navigation title stays `留言板`

- [ ] **Step 3: Replace the placeholder page with the feed**

Implement `apps/miniapp/src/pages/message-board/index.vue` with:

- light header copy
- horizontal tag chips with `全部`
- paginated list using the public API
- pinned visual marker
- source, time, title, content excerpt
- empty state, loading state, and load-more state

Core state shape:

```ts
const activeTag = ref('')
const items = ref<MiniappMessageBoardPostItem[]>([])
const tagOptions = ref<MessageBoardTagOption[]>([])
const page = ref(1)
const pageSize = 10
const loading = ref(false)
const loadingMore = ref(false)
const finished = ref(false)
```

Required page behavior:

- initial fetch on load
- `onPullDownRefresh` refreshes page 1
- `onReachBottom` loads next page when available
- changing tag resets list and fetches again
- keep styling in the current miniapp stack using UnoCSS plus small scoped SCSS only where needed

- [ ] **Step 4: Verify miniapp typing**

Run: `pnpm --filter @gaoge/app-miniapp typecheck`

Expected: PASS with the renamed page path and new feed page.

### Task 5: Cross-App Verification And Cleanup

**Files:**

- Review all files touched in Tasks 1-4

- [ ] **Step 1: Run targeted API typecheck**

Run: `pnpm --filter @gaoge/app-api typecheck`

Expected: PASS

- [ ] **Step 2: Run targeted API tests**

Run: `pnpm --filter @gaoge/app-api test -- message-board-post.service.spec.ts`

Expected: PASS

- [ ] **Step 3: Run targeted admin typecheck**

Run: `pnpm --filter @gaoge/app-admin typecheck`

Expected: PASS

- [ ] **Step 4: Run targeted miniapp typecheck**

Run: `pnpm --filter @gaoge/app-miniapp typecheck`

Expected: PASS

- [ ] **Step 5: Run repo-level lint only if targeted checks surface style or import-order issues outside one app**

Run if needed: `pnpm lint`

Expected: PASS or a clear, localized follow-up fix list.
