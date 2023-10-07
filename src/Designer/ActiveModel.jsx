import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDesigner } from './useDesigner'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Environment, OrbitControls, Stage, useFBX } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { agapeVFX } from '@/agape-engine-sdk/sdk'
import { AnimationMixer } from 'three'

export function ActiveModel() {
  return (
    <group>
      {
        <>
          <Environment files={`/hdr/greenwich_park_02_1k.hdr`}></Environment>
          <OrbitControls target={[0, 1, 0]} object-position={[0, 1.7, 2]}></OrbitControls>
          <ModelLoader></ModelLoader>
          <directionalLight position={[1, 1, 0]} intensity={1}></directionalLight>
        </>
      }
    </group>
  )
}

function ModelLoader() {
  let activeModelID = useDesigner((r) => r.activeModelID)
  let modelArray = useDesigner((r) => r.modelArray)

  let [st, setST] = useState({ compos: null, glb: null })

  useEffect(() => {
    let model = modelArray.find((r) => r.id === activeModelID)

    if (!model) {
      return
    }
    let draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    let glblaoder = new GLTFLoader()
    glblaoder.setDRACOLoader(draco)
    glblaoder.parseAsync(model.data, '/').then((r) => {
      setST({ compos: <primitive object={r.scene}></primitive>, glb: r })
    })
  }, [activeModelID, modelArray])
  useFrame((st, dt) => {
    if (st?.mixer) {
      st.mixer.update(dt)

      console.log(st.mixer)
    }
  })

  return (
    <>
      {st.glb && <Patches glb={st.glb}></Patches>}

      {st.glb && <Generator glbScene={st.glb.scene}></Generator>}

      {st.glb && <GLBAnim glbScene={st.glb.scene}></GLBAnim>}
      <group>{st.compos}</group>
    </>
  )
}

function GLBAnim({ glbScene }) {
  let fbx = useFBX('/rpm/rpm-actions-emoji/mma-kick.fbx')
  let mixer = useMemo(() => new AnimationMixer(), [])

  useEffect(() => {
    if (!fbx) {
      return
    }

    let action = mixer.clipAction(fbx?.animations[0], glbScene)
    action.reset().play()
  }, [glbScene, fbx, mixer])

  useFrame((c) => {
    mixer.setTime(c.clock.getElapsedTime())
  })

  return null
}

function Generator({ glbScene }) {
  useEffect(() => {
    if (!glbScene) {
      return
    }
    let objectNameList = []
    glbScene.traverse((it) => {
      if (it.material) {
        objectNameList.push({
          uuid: it.uuid,
          name: it.name,
          patch: null,
        })
      }
    })

    useDesigner.setState({ objectNameList: objectNameList })
  }, [glbScene])

  return null
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

      let vfx = agapeVFX.find((r) => r.id === it.patch)

      if (item?.undo) {
        item.undo()
      }

      if (it.patch === 'default') {
      } else if (item && vfx && gl) {
        if (!item.undo) {
          item.undo = async () => {
            await vfx.api.undoFX({ mounter: scene, item: item, renderer: gl, onLoop })
          }
        }

        await vfx.api.preload()
        await vfx.api.applyFX({ mounter: scene, item: item, renderer: gl, onLoop })
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
