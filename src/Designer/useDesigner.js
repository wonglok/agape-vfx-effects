import { create } from 'zustand'
export const useDesigner = create((set, get) => {
  let saveTimer = 0
  return {
    seed: 0,
    objectNameList: [],
    activeName: '',
    activeModelID: '',
    modelArray: [],
    hydrate: async () => {
      let localforage = await import('localforage')
      {
        let modelDB = localforage.createInstance({
          name: 'modelDB',
          driver: localforage.INDEXEDDB,
        })
        set({ modelDB: modelDB })
      }

      get().load({ dbs: ['all'] })

      let activeModelID = localStorage.getItem('activeModelID')
      if (activeModelID) {
        set({ activeModelID: activeModelID })
      }
    },
    load: async ({ dbs = [] }) => {
      if (dbs.includes('all') || dbs.includes('modelDB')) {
        let idb = get().modelDB
        let values = await idb.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => {
              return idb.getItem(key)
            }),
          )
        })

        set({ modelArray: values })
      }
    },
    addModel: async ({ name, id, data, patches = [] }) => {
      let modelDB = get().modelDB
      await modelDB.setItem(id, { name, id, data, patches })
      await get().load({ dbs: ['modelDB'] })
      get().selectModel({ id })
    },
    saveModel: async ({ id, data }) => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(async () => {
        let modelDB = get().modelDB
        await modelDB.setItem(id, data)
        await get().load({ dbs: ['modelDB'] })
        get().selectModel({ id })
      })
    },
    removeModel: async ({ id }) => {
      let modelDB = get().modelDB
      await modelDB.removeItem(id)
      await get().load({ dbs: ['modelDB'] })
    },
    selectModel: ({ id }) => {
      set({ activeModelID: id })
      localStorage.setItem('activeModelID', id)
    },
    //
  }
})
