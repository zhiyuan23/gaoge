// 球队数据
export const teams = [
  {
    id: 'gaoge-fc',
    name: '高歌FC',
    type: 'football',
    icon: 'fluent:sport-soccer-20-filled',
  },
  {
    id: 'warm-sunshine',
    name: '环球港篮球',
    type: 'basketball',
    icon: 'ion:basketball-sharp',
  },
]

// 主题色配置
export const teamColors = {
  'gaoge-fc': {
    primary: '#1ed760', // 绿色
    text: '#000',
  },
  'warm-sunshine': {
    primary: '#f6e500', // 黄色
    text: '#000',
  },
}

export const teamData = {
  'gaoge-fc': {
    name: '高歌FC',
    fullName: 'Gaoge Football Club',
    founded: '2023',
    city: '沈阳',
    stadium: '腾辉体育中心',
    description: '“将足球浪漫主义坚决贯彻到底。” —— 齐达内',
    heroImage: 'https://pic1.imgdb.cn/item/69da137fc55d9aecca818093.jpg',
    heroImageOffsetX: 60,
    gallery: [
      'https://pic1.imgdb.cn/item/69da1217c55d9aecca817c53.jpg',
      'https://pic1.imgdb.cn/item/69da1216c55d9aecca817c4b.jpg',
      'https://pic1.imgdb.cn/item/69da1216c55d9aecca817c4d.jpg',
      'https://pic1.imgdb.cn/item/69da1217c55d9aecca817c50.jpg',
    ],
    players: [
      { id: 1, name: '张明', position: '前锋', number: 10, x: 20, y: 35, zoom: 10 },
      { id: 2, name: '李华', position: '中场', number: 8, x: 40, y: 25, zoom: 10 },
      { id: 3, name: '王强', position: '后卫', number: 4, x: 60, y: 30, zoom: 10 },
      { id: 4, name: '赵磊', position: '门将', number: 1, x: 80, y: 40, zoom: 10 },
      { id: 5, name: '刘洋', position: '前锋', number: 11, x: 30, y: 55, zoom: 10 },
      { id: 6, name: '陈涛', position: '中场', number: 6, x: 50, y: 60, zoom: 10 },
    ],
  },
  'warm-sunshine': {
    name: '热烈暖阳篮球俱乐部',
    fullName: 'warm-sunshine Basketball Club',
    founded: '2025',
    city: '沈阳',
    stadium: '环球港篮球公园',
    description: '“我喜欢篮球，这一次没有撒谎。” —— 科比',
    heroImage: 'https://pic1.imgdb.cn/item/69da135fc55d9aecca818030.jpg',
    heroImageOffsetX: 70,
    gallery: [
      'https://pic1.imgdb.cn/item/69da12b5c55d9aecca817e1c.jpg',
      'https://pic1.imgdb.cn/item/69da1296c55d9aecca817dad.jpg',
      'https://pic1.imgdb.cn/item/69da1296c55d9aecca817dac.jpg',
      'https://pic1.imgdb.cn/item/69da1297c55d9aecca817db4.jpg',
    ],
    players: [
      { id: 1, name: '林凯', position: '后卫', number: 23, x: 25, y: 30, zoom: 3 },
      { id: 2, name: '周杰', position: '前锋', number: 15, x: 50, y: 25, zoom: 3 },
      { id: 3, name: '吴浩', position: '中锋', number: 33, x: 75, y: 35, zoom: 3 },
      { id: 4, name: '郑鹏', position: '后卫', number: 7, x: 40, y: 60, zoom: 3 },
    ],
  },
}
