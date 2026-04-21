<route lang="yaml">
meta:
  title: 高歌
</route>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onUnmounted, ref } from 'vue'

// 获取容器元素的引用
const canvasContainer = ref<HTMLElement | null>(null)

// 声明 Three.js 相关变量
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xa0a0a0) // 设置场景背景色

// 初始化辅助轴线（可选，便于调试）
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// 添加灯光
const ambientLight = new THREE.AmbientLight(0x404040) // 柔和的环境光
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8) // 明亮的平行光
directionalLight.position.set(1, 1, 1)
scene.add(directionalLight)

// 创建一个立方体
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number

// 初始化 Three.js
function initThree() {
  if (!canvasContainer.value) {
    return
  }

  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  // 创建相机
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)

  // 添加轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 启用阻尼（惯性）效果，使控制更平滑

  // 开始动画循环
  animate()
}

// 动画循环
function animate() {
  animationId = requestAnimationFrame(animate)

  // 可以在这里添加一些动画，例如旋转立方体
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01

  controls.update() // 如果启用了阻尼，需要在动画循环中更新控制器
  renderer.render(scene, camera)
}

// 处理窗口大小变化
function handleResize() {
  if (!canvasContainer.value || !camera || !renderer) {
    return
  }
  const width = canvasContainer.value.clientWidth
  const height = canvasContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 组件卸载时清除资源，防止内存泄漏
  window.removeEventListener('resize', handleResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  controls?.dispose() // 销毁控制器
  renderer?.dispose() // 销毁渲染器
  // 几何体和材质的清理如果需要更彻底，可以遍历scene进行dispose
  geometry.dispose()
  material.dispose()
})
</script>

<template>
  <div>
    <div ref="canvasContainer" style="width: 100%; height: 100vh" />
  </div>
</template>

<style scoped>
/* 可以添加一些样式 */
</style>
