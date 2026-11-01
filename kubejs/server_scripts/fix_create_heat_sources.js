// 把 Create: New Age（电气时代）的锅炉加热器注册为农夫乐事热源。
// 根因：CCK 2.6.0 改为“尊重 farmersdelight:heat_sources 标签”后，
//       未进入该标签的方块不再被 CCK 强制当作热源。
//
// 重要：1.21.1 的标签不支持可选条目，写错任何一个 ID 都会让【整个标签】加载失败。
//       所以这里只放已确认存在的 ID，不要随手加猜测的 ID。

ServerEvents.tags('block', event => {
  event.add('farmersdelight:heat_sources', 'create_new_age:heater')
})
