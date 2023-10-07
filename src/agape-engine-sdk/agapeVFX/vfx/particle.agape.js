import { Runner } from '@/agape-engine-sdk/agapeLibrary/RiggedEngine/Runner'

export const typeName = 'particle1'
export const displayName = 'Particle VFX 3'

export const cache = new Map()
export const preload = async () => {
  //
}

export const undoFX = async ({ item, mounter, renderer, onLoop }) => {
  //
  let fnc = item.undoProcedure
  if (fnc) {
    fnc()
  }
}

export const applyFX = async ({ item, mounter, renderer, onLoop }) => {
  //

  let core = {
    cleans: [],
    onLoop: (v) => {
      onLoop(v)
    },
    onClean: (v) => {
      core.cleans.push(v)
    },
  }

  //
  item.undoProcedure = () => {
    core.cleans.forEach((t) => {
      t()
    })
  }

  if (item.isSkinnedMesh) {
    let runner = new Runner({ skinnedMesh: item, gl: renderer })

    core.onLoop((st, dt) => {
      runner.work(st, dt)
    })
    item.parent.add(runner)
    core.onClean(() => {
      runner.removeFromParent()
    })
  }
  //

  //

  //

  //
}
