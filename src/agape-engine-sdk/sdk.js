import md5 from 'md5'
import { basename } from 'path'

let materials = []
function importAll(r) {
  r.keys().forEach((key) => {
    let loadedItem = r(key)

    let item = {
      id: `${md5(basename(key))}`,
      key: key,
      name: basename(key),
      typeName: loadedItem.typeName,
      displayName: loadedItem.displayName,
      all: loadedItem,
    }
    if (materials.some((r) => r.id === item.id)) {
    } else {
      materials.push(item)
    }
  })
}

importAll(require.context('./materials/', true, /\.material\.js$/))

export { materials }
