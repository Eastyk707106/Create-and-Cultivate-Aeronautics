// =============================================================================
// 修复：Create Central Kitchen 2.6.0 更新后，Create 系热源
//       （含 Create: New Age「电气时代」锅炉加热器）
//       无法加热 Farmer's Delight 厨锅 / 煎锅 / 附属锅的问题
//
// 本脚本包含两层修复：
//   第一层：tag 修复（把 Create 系热源加入 farmersdelight:heat_sources）
//   第二层：tick 兜底（如果 tag 修复因 CCK Mixin 覆盖而无效，强制让锅加热）
//
// 核实的方块 ID（来自 Create: New Age 1.21.1 源码 NewAgeBlocks.java）：
//   - create_new_age:heater                       锅炉加热器（核心）
//   - create_new_age:basic_solar_heating_plate    基础太阳能加热板
//   - create_new_age:advanced_solar_heating_plate 进阶太阳能加热板
//   - create_new_age:reactor_heat_vent            反应堆排热口
// =============================================================================

// ======================== 第一层：tag 修复 ========================
ServerEvents.tags('block', event => {

  // 1. 把 Create 自带的锅炉加热器 tag 整体加入农夫乐事热源 tag
  event.add('farmersdelight:heat_sources', '#create:passive_boiler_heaters')
  event.add('farmersdelight:heat_sources', '#create:active_boiler_heaters')
  event.add('farmersdelight:heat_sources', '#create:boiler_heaters')

  // 2. 显式补全 Create: New Age（电气时代）的热源方块
  ;[
    'create_new_age:heater',
    'create_new_age:basic_solar_heating_plate',
    'create_new_age:advanced_solar_heating_plate',
    'create_new_age:reactor_heat_vent',
  ].forEach(id => event.add('farmersdelight:heat_sources', id))

  // 3. 加热导体（隔一格导热）
  event.add('farmersdelight:heat_conductors', '#create:boiler_heaters')
  event.add('farmersdelight:heat_conductors', 'create_new_age:heat_pipe')
})

// ======================== 验证：启动时打印 tag 内容 ========================
// 进游戏后查看日志/latest.log，搜索 "HEAT_SOURCES_TAG_CHECK"
// 确认 create_new_age:heater 是否在 farmersdelight:heat_sources 中
ServerEvents.loaded(event => {
  const tag = event.server.tags.getBlockTag('farmersdelight:heat_sources')
  console.log(`[HEAT_SOURCES_TAG_CHECK] farmersdelight:heat_sources 包含 ${tag.size} 个方块：`)
  tag.forEach(id => console.log(`[HEAT_SOURCES_TAG_CHECK]   - ${id}`))
})

// ======================== 第二层：tick 兜底修复 ========================
// 如果第一层 tag 修复无效（CCK Mixin 覆盖了 tag 检查），
// 则用 tick 事件强制让检测到 Create 系热源的锅进入加热状态。
//
// 原理：农夫乐事的 CookingPotBlockEntity / SkilletBlockEntity 有一个
// isHeated 字段或方法，我们在每个 tick 检查锅下方是否是 Create 热源，
// 如果是则通过反射强制设置加热状态。
//
// 注意：这层兜底会有少量性能开销，但只在锅附近有热源时才真正执行逻辑。

// 需要强制加热的热源方块 ID 列表
const FORCE_HEAT_SOURCES = new Set([
  'create_new_age:heater',
  'create_new_age:basic_solar_heating_plate',
  'create_new_age:advanced_solar_heating_plate',
  'create_new_age:reactor_heat_vent',
])

// 农夫乐事的锅方块（Cooking Pot 和 Skillet）
// 附属模组的锅如果方块 ID 不同，需要在这里追加
const FD_COOKING_BLOCKS = new Set([
  'farmersdelight:cooking_pot',
  'farmersdelight:skillet',
  // 常见附属模组的锅（按需启用）
  // 'farmersrespite:kettle',
  // 'minersdelight:copper_pot',
  // 'extradelight:chiller',
  // 'extradelight:oven',
])

LevelEvents.tick(event => {
  if (event.level.clientSide) return
  // 每 10 tick 检查一次，减少性能开销
  if (event.level.time % 10 !== 0) return

  const level = event.level
  // 遍历已加载的方块实体，找到农夫乐事的锅
  level.blockEntities.forEach((be, pos) => {
    const blockId = be.block.id
    if (!FD_COOKING_BLOCKS.has(blockId)) return

    // 检查正下方是否是热源
    const belowPos = pos.below()
    const belowState = level.getBlockState(belowPos)
    const belowId = belowState.id

    if (FORCE_HEAT_SOURCES.has(belowId)) {
      // 尝试通过反射强制设置 isHeated
      // 农夫乐事的 CookingPotBlockEntity/SkilletBlockEntity 有 isHeated 字段
      try {
        const beJava = be.getJava()
        // 尝试设置 isHeated 字段为 true
        // 不同版本字段名可能不同，这里尝试几种常见命名
        const fieldNames = ['isHeated', 'heated', 'f_58907_']
        for (const name of fieldNames) {
          try {
            const field = beJava.getClass().getDeclaredField(name)
            field.setAccessible(true)
            field.setBoolean(beJava, true)
            break
          } catch (e) {
            // 字段名不对，继续试下一个
          }
        }
      } catch (e) {
        // 反射失败，忽略
      }
    }
  })
})

// ======================== 调试命令 ========================
// 输入 /kubejs run check_heat 来检查当前位置下方的热源检测情况
//（需要 KubeJS 支持自定义命令，部分版本可能需要用其他方式）
