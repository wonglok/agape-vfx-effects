import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDesigner } from './useDesigner'
import { useFBX } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { AnimationMixer } from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export function ModelLoader() {
  let activeModelID = useDesigner((r) => r.activeModelID)

  let [st, setST] = useState({ compos: null, glb: null })

  useEffect(() => {
    let modelArray = useDesigner.getState().modelArray

    let model = modelArray.find((r) => r.id === activeModelID)

    let draco = new DRACOLoader()
    draco.setDecoderPath('/draco/')
    let glblaoder = new GLTFLoader()
    glblaoder.setDRACOLoader(draco)
    glblaoder.loadAsync(model.data).then((r) => {
      let glbScene = r.scene
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

      setST({ compos: <primitive object={r.scene}></primitive>, glb: r })
    })
  }, [activeModelID])

  return (
    <>
      {st.glb && <Patches glb={st.glb}></Patches>}

      {st.glb && st.glb.scene.getObjectByName('Hips') && <GLBAnim glbScene={st.glb.scene}></GLBAnim>}
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
    let ttt = setInterval(() => {
      if (window.agapeVFX) {
        clearInterval(ttt)
        list.forEach(async (it) => {
          let item = scene.getObjectByProperty('uuid', it.uuid)

          let vfx = window.agapeVFX.find((r) => r.id === it.patch)

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
