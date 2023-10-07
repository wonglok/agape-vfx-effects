import { Environment, OrbitControls } from '@react-three/drei'
import { ModelLoader } from './ModelLoader'
import { useDesigner } from './useDesigner'

export function ActiveModel() {
  let modelArray = useDesigner((r) => r.modelArray)
  let activeModelID = useDesigner((r) => r.activeModelID)
  let model = modelArray.find((r) => r.id === activeModelID)
  //

  //
  return (
    <group>
      {
        <>
          <Environment files={`/hdr/greenwich_park_02_1k.hdr`}></Environment>
          <OrbitControls target={[0, 1, 0]} object-position={[0, 1.7, 2]}></OrbitControls>
          {model && <ModelLoader></ModelLoader>}
        </>
      }
    </group>
  )
}
