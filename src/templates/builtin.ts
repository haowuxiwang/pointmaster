import { EquipmentTemplate } from '@/types'

export const builtinTemplates: EquipmentTemplate[] = [
  {
    id: 'sterilizer-pulsed-vacuum',
    name: '脉动真空灭菌器',
    category: '灭菌器',
    chamber: {
      type: 'cuboid',
      name: '脉动真空灭菌器',
      dimensions: { width: 1200, depth: 800, height: 1000, layers: 2 },
      ventPorts: [
        { x: 100, y: 100, z: 0 }, // 左前排气口（冷点）
        { x: 1100, y: 100, z: 0 }, // 右前排气口（冷点）
      ],
    },
    defaultPointCount: 12,
  },
  {
    id: 'sterilizer-vertical',
    name: '立式灭菌器',
    category: '灭菌器',
    chamber: {
      type: 'cuboid',
      name: '立式灭菌器',
      dimensions: { width: 600, depth: 600, height: 800, layers: 1 },
      ventPorts: [
        { x: 100, y: 100, z: 0 }, // 排气口（冷点）
      ],
    },
    defaultPointCount: 10,
  },
  {
    id: 'sterilizer-tubular',
    name: '管式灭菌器',
    category: '灭菌器',
    chamber: {
      type: 'cylinder',
      name: '管式灭菌器',
      dimensions: { width: 300, depth: 300, height: 2000, layers: 1 },
      radius: 150,
      ventPorts: [
        { x: 150, y: 50, z: 0 }, // 排气口（冷点）
      ],
    },
    defaultPointCount: 12,
  },
  {
    id: 'freeze-dryer',
    name: '冻干机',
    category: '冻干机',
    chamber: {
      type: 'cuboid',
      name: '冻干机',
      dimensions: { width: 1500, depth: 1000, height: 600, layers: 4 },
    },
    defaultPointCount: 16,
  },
  {
    id: 'warehouse',
    name: '仓库/冷库',
    category: '仓库',
    chamber: {
      type: 'cuboid',
      name: '仓库',
      dimensions: { width: 3000, depth: 2000, height: 2500, layers: 1 },
    },
    defaultPointCount: 20,
  },
  {
    id: 'oven',
    name: '烘箱',
    category: '烘箱',
    chamber: {
      type: 'cuboid',
      name: '烘箱',
      dimensions: { width: 800, depth: 600, height: 500, layers: 2 },
    },
    defaultPointCount: 9,
  },
  {
    id: 'refrigerator',
    name: '冰箱/冷藏柜',
    category: '冷藏设备',
    chamber: {
      type: 'cuboid',
      name: '冰箱',
      dimensions: { width: 800, depth: 600, height: 1200, layers: 3 },
    },
    defaultPointCount: 10,
  },
  {
    id: 'seed-tank',
    name: '种子罐',
    category: '发酵罐',
    chamber: {
      type: 'cylinder',
      name: '种子罐',
      dimensions: { width: 610, depth: 610, height: 2000, layers: 2 },
      radius: 305,
      nozzles: [
        { name: '压缩空气', position: { x: 305, y: 0, z: 1800 } },
        { name: '排汽', position: { x: 305, y: 305, z: 1900 } },
        { name: '排污', position: { x: 305, y: 305, z: 100 } },
        { name: '接种口', position: { x: 0, y: 305, z: 1500 } },
      ],
    },
    defaultPointCount: 12,
  },
  {
    id: 'fermenter-3stage',
    name: '三级发酵罐',
    category: '发酵罐',
    chamber: {
      type: 'cylinder',
      name: '三级发酵罐',
      dimensions: { width: 700, depth: 700, height: 2500, layers: 3 },
      radius: 350,
      nozzles: [
        { name: '压缩空气', position: { x: 350, y: 0, z: 2200 } },
        { name: '排汽', position: { x: 350, y: 350, z: 2400 } },
        { name: '排污', position: { x: 350, y: 350, z: 100 } },
        { name: '接种口', position: { x: 0, y: 350, z: 1800 } },
      ],
      hasCoil: true,
    },
    defaultPointCount: 12,
  },
  {
    id: 'shaker-room',
    name: '摇瓶机房间',
    category: '摇瓶机',
    chamber: {
      type: 'cuboid',
      name: '摇瓶机',
      dimensions: { width: 1200, depth: 800, height: 1500, layers: 3 },
      roomContext: {
        roomDimensions: { width: 4000, depth: 3000, height: 2500 },
        offset: { x: 1400, y: 1100, z: 0 },
        devices: [
          {
            name: '空调机组',
            dimensions: { width: 600, depth: 600, height: 1800 },
            position: { x: 3200, y: 1200, z: 0 },
          },
        ],
        doors: [{ position: { x: 0, y: 1500, z: 0 }, label: '门' }],
      },
    },
    defaultPointCount: 12,
  },
]
