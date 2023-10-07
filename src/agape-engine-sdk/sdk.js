import md5 from 'md5'
import { basename } from 'path'

let agapeVFX = []
function importAll(r) {
  r.keys().forEach((key) => {
    let loadedItem = r(key)

    let item = {
      id: `${md5(basename(key))}`,
      key: key,
      name: basename(key),
      typeName: loadedItem.typeName,
      displayName: loadedItem.displayName,
      api: loadedItem,
    }
    if (agapeVFX.some((r) => r.id === item.id)) {
    } else {
      agapeVFX.push(item)
    }
  })
}

importAll(require.context('./agapeVFX/', true, /\.agape\.js$/))

export { agapeVFX }
