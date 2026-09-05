// =============================================================================
// 修复：Create Central Kitchen 2.6.0 更新后，Create 系热源
//       （含 Create: New Age「电气时代」锅炉加热器）
//       无法加热 Farmer's Delight 厨锅 / 煎锅 / 附属锅的问题
//
// 根因：CCK 2.6.0 修复了 Issue #166，改为「尊重 farmersdelight:heat_sources tag」。
//       但 Create: New Age 1.2.0 的加热器既不在该 tag 中，
//       也未被 CCK 硬编码识别，导致热源检测完全失效。
//
// 修复：把所有 Create 系热源方块加入 farmersdelight:heat_sources block tag。
//
// 核实的方块 ID（来自 Create: New Age 1.21.1 分支源码 NewAgeBlocks.java）：
//   - create_new_age:heater                       锅炉加热器（核心）
//   - create_new_age:basic_solar_heating_plate    基础太阳能加热板
//   - create_new_age:advanced_solar_heating_plate 进阶太阳能加热板
//   - create_new_age:reactor_heat_vent            反应堆排热口
// =============================================================================

ServerEvents.tags('block', event => {

  // ---------------------------------------------------------------
  // 1. 把 Create 自带的锅炉加热器 tag 整体加入农夫乐事热源 tag
  //    ——覆盖 Create 原版所有锅炉加热器，以及注册进这些 tag 的附属模组加热器
  // ---------------------------------------------------------------
  event.add('farmersdelight:heat_sources', '#create:passive_boiler_heaters')
  event.add('farmersdelight:heat_sources', '#create:active_boiler_heaters')
  event.add('farmersdelight:heat_sources', '#create:boiler_heaters')

  // ---------------------------------------------------------------
  // 2. 显式补全 Create: New Age（电气时代）1.2.0 的热源方块
  //    ID 已通过源码核实，未安装该模组时 KubeJS 会自动忽略不存在的 ID
  // ---------------------------------------------------------------
  ;[
    'create_new_age:heater',                       // 锅炉加热器（主要热源）
    'create_new_age:basic_solar_heating_plate',    // 基础太阳能加热板
    'create_new_age:advanced_solar_heating_plate', // 进阶太阳能加热板
    'create_new_age:reactor_heat_vent',            // 反应堆排热口
  ].forEach(id => event.add('farmersdelight:heat_sources', id))

  // ---------------------------------------------------------------
  // 3. 兼容：把 Create 锅炉加热器也加入农夫乐事加热导体 tag
  //    （让锅与热源之间隔一格时仍可导热，类似漏斗的效果）
  // ---------------------------------------------------------------
  event.add('farmersdelight:heat_conductors', '#create:boiler_heaters')
  event.add('farmersdelight:heat_conductors', 'create_new_age:heat_pipe')

  // ---------------------------------------------------------------
  // 【如何自行核实 / 追加其他热源方块 ID】
  // 进游戏后：
  //   a. 手里拿着要核实的方块
  //   b. 输入指令：/kubejs hand
  //   c. 聊天栏会输出类似 "create_new_age:heater" 的真实 ID
  //   d. 把真实 ID 追加到上方数组里，/reload 即可
  // ---------------------------------------------------------------
})
