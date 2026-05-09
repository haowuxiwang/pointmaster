import { EquipmentTemplate } from '@/types'

export const builtinTemplates: EquipmentTemplate[] = [
  {
    id: 'sterilizer-pulsed-vacuum',
    name: '脉动真空灭菌器',
    category: '灭菌器',
    chamber: { type: 'cuboid', name: '脉动真空灭菌器', dimensions: { width: 1200, depth: 800, height: 1000 } },
    defaultPointCount: 12,
  },
  {
    id: 'sterilizer-vertical',
    name: '立式灭菌器',
    category: '灭菌器',
    chamber: { type: 'cuboid', name: '立式灭菌器', dimensions: { width: 600, depth: 600, height: 800 } },
    defaultPointCount: 10,
  },
  {
    id: 'sterilizer-tubular',
    name: '管式灭菌器',
    category: '灭菌器',
    chamber: { type: 'cylinder', name: '管式灭菌器', dimensions: { width: 300, depth: 300, height: 2000 }, radius: 150 },
    defaultPointCount: 12,
  },
  {
    id: 'freeze-dryer',
    name: '冻干机',
    category: '冻干机',
    chamber: { type: 'cuboid', name: '冻干机', dimensions: { width: 1500, depth: 1000, height: 600 } },
    defaultPointCount: 16,
  },
  {
    id: 'warehouse',
    name: '仓库/冷库',
    category: '仓库',
    chamber: { type: 'cuboid', name: '仓库', dimensions: { width: 3000, depth: 2000, height: 2500 } },
    defaultPointCount: 20,
  },
  {
    id: 'oven',
    name: '烘箱',
    category: '烘箱',
    chamber: { type: 'cuboid', name: '烘箱', dimensions: { width: 800, depth: 600, height: 500 } },
    defaultPointCount: 9,
  },
]
