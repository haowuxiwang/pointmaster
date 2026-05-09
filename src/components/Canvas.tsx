import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { ChamberShapeUtil } from '@/shapes/ChamberShape'
import { ProbePointShapeUtil } from '@/shapes/ProbePointShape'
import { TextAnnotationShapeUtil } from '@/shapes/TextAnnotationShape'
import { DimensionShapeUtil } from '@/shapes/DimensionShape'
import { LegendShapeUtil } from '@/shapes/LegendShape'
import { ProbePointTool } from '@/tools/ProbePointTool'

const shapeUtils = [ChamberShapeUtil, ProbePointShapeUtil, TextAnnotationShapeUtil, DimensionShapeUtil, LegendShapeUtil]
const tools = [ProbePointTool]

export default function Canvas() {
  return (
    <div className="flex-1 h-full">
      <Tldraw shapeUtils={shapeUtils} tools={tools} />
    </div>
  )
}
