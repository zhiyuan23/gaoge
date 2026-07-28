/**
 * 页面区块配置
 *
 * @property {string} id - 区块唯一标识
 * @property {string} kicker - 顶部标签文字
 * @property {string} title - 主标题
 * @property {string} description - 描述文字
 * @property {string} image - 背景图片路径
 * @property {string} [ctaLabel] - 按钮文字（可选）
 * @property {string} [contentPosition='center'] - 内容位置
 *   可选值: center, top-left, top-center, top-right,
 *          bottom-left, bottom-center, bottom-right,
 *          left-center, right-center
 * @property {number} [mobileImageOffset=0] - 移动端图片水平偏移百分比
 *   可选值: 负数向左偏移，正数向右偏移，0 为居中
 *   例如: -10 表示向左偏移 10%, 10 表示向右偏移 10%
 */
export const homepageSections = [
  {
    id: '1',
    kicker: 'Gaoge Sports',
    title: '高歌',
    description: '将运动浪漫主义坚决贯彻到底。',
    image: 'https://pic1.imgdb.cn/item/69da11a2c55d9aecca817a13.jpg',
    ctaLabel: '向下阅读',
    contentPosition: 'bottom-right',
    mobileImageOffset: 20,
  },
  {
    id: '2',
    kicker: '01 / Strength',
    title: '实力',
    description: '将运动浪漫主义坚决贯彻到底。',
    image: 'https://pic1.imgdb.cn/item/69da11a2c55d9aecca817a12.jpg',
    contentPosition: 'center',
    mobileImageOffset: 5,
  },
  {
    id: '3',
    kicker: '02 / Struggle',
    title: '拼搏',
    description: '将运动浪漫主义坚决贯彻到底。',
    image: 'https://pic1.imgdb.cn/item/69da11a2c55d9aecca817a14.jpg',
    contentPosition: 'bottom-center',
    mobileImageOffset: 30,
  },
  {
    id: '4',
    kicker: '03 / Spirit',
    title: '精神',
    description: '将运动浪漫主义坚决贯彻到底。',
    image: 'https://pic1.imgdb.cn/item/69da11a2c55d9aecca817a15.jpg',
    contentPosition: 'bottom-right',
    mobileImageOffset: -8,
  },
  {
    id: '5',
    kicker: '04 / Beyond The Match',
    title: '传奇',
    description: '将运动浪漫主义坚决贯彻到底。',
    image: 'https://pic1.imgdb.cn/item/69da11a2c55d9aecca817a17.jpg',
    ctaLabel: '了解更多',
    ctaLink: '/teams',
    contentPosition: 'center',
    mobileImageOffset: 0,
  },
]
