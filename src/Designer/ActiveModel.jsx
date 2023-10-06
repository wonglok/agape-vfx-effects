import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDesigner } from './useDesigner'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { OrbitControls, Stage } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { materials } from '@/agape-engine-sdk/sdk'
import { MeshBasicMaterial } from 'three150'

export function ActiveModel() {
  let activeModelID = useDesigner((r) => r.activeModelID)

  let modelArray = useDesigner((r) => r.modelArray)

  let model = modelArray.find((r) => r.id === activeModelID)

  return (
    <group>
      {model && (
        <Stage intensity={1} environment={{ files: `/hdr/greenwich_park_02_1k.hdr` }}>
          <OrbitControls></OrbitControls>
          <ModelLoader model={model}></ModelLoader>
        </Stage>
      )}
    </group>
  )
}

function ModelLoader({ model }) {
  let [st, setST] = useState({ compos: null, glb: null })

  useEffect(() => {
    let draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    let glblaoder = new GLTFLoader()
    glblaoder.setDRACOLoader(draco)
    glblaoder.parseAsync(model.data, '/').then((r) => {
      // console.log(r)

      setST({ compos: <primitive object={r.scene}></primitive>, glb: r })

      let objectNameList = []
      r.scene.traverse((it) => {
        if (it.material) {
          objectNameList.push({
            uuid: it.uuid,
            name: it.name,
            patch: null,
          })
        }
      })

      useDesigner.setState({ objectNameList: objectNameList })
    })
  }, [model])

  return (
    <>
      {st.glb && <Patches glb={st.glb}></Patches>}

      {st.compos}
    </>
  )
}

function Patches({ glb }) {
  let objectNameList = useDesigner((r) => r.objectNameList)

  let list = objectNameList.filter((r) => r.patch)

  let tasks = useMemo(() => {
    return []
  }, [])

  let onLoop = useCallback(
    (v) => {
      tasks.push(v)
    },
    [tasks],
  )

  useFrame((st, dt) => {
    tasks.forEach((it) => {
      it(st, dt)
    })
  })

  let gl = useThree((r) => r.gl)
  let scene = useThree((r) => r.scene)
  useEffect(() => {
    //

    list.forEach(async (it) => {
      let item = scene.getObjectByProperty('uuid', it.uuid)

      let materailInfo = materials.find((r) => r.id === it.patch)

      if (it.patch === 'default') {
        if (item.oldMat) {
          item.material = item.oldMat
          item.needsUpdate = true
        }
      } else if (item && materailInfo) {
        await materailInfo.all.preload()
        let newMat = await materailInfo.all.getMaterialAsync({ renderer: gl, onLoop })

        if (!item.oldMat) {
          item.oldMat = item.material.clone()
        }
        item.material = newMat
        item.needsUpdate = true
      }
    })

    //
  }, [list, gl, onLoop, glb, scene])
  //
  return (
    <>
      {/*  */}

      {/*  */}
    </>
  )
}
