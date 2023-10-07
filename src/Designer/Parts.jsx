import { agapeVFX } from '@/agape-engine-sdk/sdk'
import { useDesigner } from './useDesigner'

export function Parts() {
  let objectNameList = useDesigner((r) => r.objectNameList)
  return (
    <>
      <div className='border-b border-gray-500 bg-gray-200 p-2 text-center'>Parts</div>

      {objectNameList.map((r) => {
        return <OnePart key={r.uuid} item={r}></OnePart>
      })}
    </>
  )
}

function OnePart({ item }) {
  // console.log(materials)
  return (
    <div>
      <div className='bg-gray-200 text-sm text-gray-800 hover:opacity-80'>
        <div className=' px-2 pt-2'>{item.name}</div>
        <div className=' px-2 pb-2'>
          <select
            defaultValue={'default'}
            onChange={(ev) => {
              console.log('select', ev.target.value)

              item.patch = ev.target.value

              useDesigner.setState({
                objectNameList: JSON.parse(JSON.stringify(useDesigner.getState().objectNameList)),
                seed: useDesigner.getState().seed + 1,
              })
            }}
          >
            <option value='default'>Default Material</option>

            {agapeVFX.map((r) => {
              return (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              )
            })}
          </select>
        </div>
      </div>
    </div>
  )
}
