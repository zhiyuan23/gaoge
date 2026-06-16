# Banner 副标题与列表路由调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Banner 管理列表接口改为 `/content/banners/list`，并为 Banner 增加可选副标题字段 `subtitle`，贯通 API、shared types 和 admin 表单列表。

**Architecture:** 后端 Banner 模块增量扩展 `subtitle` 可空字段，并直接替换 admin 列表路由；前端 admin 在现有 CRUD 结构内补字段映射、表单输入和表格展示，不做通用抽象。

**Tech Stack:** NestJS, Prisma, Vue 3, Element Plus, Jest, vue-tsc

---
