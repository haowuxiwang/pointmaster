import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect } from 'react'
import { ChamberShapeUtil } from '@/shapes/ChamberShape'
import { ProbePointShapeUtil } from '@/shapes/ProbePointShape'
import { TextAnnotationShapeUtil } from '@/shapes/TextAnnotationShape'
import { DimensionShapeUtil } from '@/shapes/DimensionShape'
import { LegendShapeUtil } from '@/shapes/LegendShape'
import { DrainPortShapeUtil } from '@/shapes/DrainPortShape'
import { BuiltInProbeShapeUtil } from '@/shapes/BuiltInProbeShape'
import { ProbePointTool } from '@/tools/ProbePointTool'
import { DrainPortTool } from '@/tools/DrainPortTool'
import { BuiltInProbeTool } from '@/tools/BuiltInProbeTool'
import { useProjectStore } from '@/store/projectStore'

const shapeUtils = [ChamberShapeUtil, ProbePointShapeUtil, TextAnnotationShapeUtil, DimensionShapeUtil, LegendShapeUtil, DrainPortShapeUtil, BuiltInProbeShapeUtil]
const tools = [ProbePointTool, DrainPortTool, BuiltInProbeTool]

function EditorSync() {
  const editor = useEditor()
  const setEditor = useProjectStore((s) => s.setEditor)

  useEffect(() => {
    setEditor(editor)
    return () => setEditor(null)
  }, [editor, setEditor])

  return null
}

export default function Canvas() {
  return (
    <div className="flex-1 h-full">
      <Tldraw shapeUtils={shapeUtils} tools={tools} hideUi={true}>
        <EditorSync />
      </Tldraw>
    </div>
  )
}
