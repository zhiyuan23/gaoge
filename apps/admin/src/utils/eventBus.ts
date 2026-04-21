import mitt from 'mitt'

interface MittTypes {
  [key: string | symbol]: any
}

export default mitt<MittTypes>()

// 使用方法
// ComponentA.vue
// const login = () => {
//   bus.emit('user-login', { username: 'Alice' })
// }

// ComponentB.vue
// onMounted(() => {
//   bus.on('user-login', handleLogin)
// })

// onUnmounted(() => {
//   bus.off('user-login', handleLogin) // 避免内存泄漏
// })
