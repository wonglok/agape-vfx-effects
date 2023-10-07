import md5 from 'md5'
import { useDesigner } from './useDesigner'

export function Models() {
  let modelArray = useDesigner((r) => r.modelArray)

  return (
    <>
      <div className='border-b border-gray-500 bg-gray-200 p-2 text-center'>Models</div>
      <div
        onClick={() => {
          //
          let input = document.createElement('input')
          input.type = 'file'
          input.multiple = true
          input.onchange = (btn) => {
            //

            let files = btn.target.files

            if (files) {
              for (let i = 0; i < files.length; i++) {
                let file = files[i]
                let reader = new FileReader()
                reader.onload = (e) => {
                  let data = e.target.result
                  useDesigner
                    .getState()
                    .addModel({ name: file.name, id: md5(data + file.name), data: data, patches: [] })
                }
                reader.readAsDataURL(file)
              }
            }
          }
          input.click()
        }}
        className='cursor-pointer border-b border-gray-500 bg-gray-200 p-2 text-center hover:opacity-80'
      >
        Add Models
      </div>
      {modelArray.map((r) => {
        return <ModelOne key={r.id} item={r}></ModelOne>
      })}
    </>
  )
}

function ModelOne({ item }) {
  let activeModelID = useDesigner((r) => r.activeModelID)
  return (
    <>
      <div className='flex h-12 w-full border-b border-gray-500 bg-gray-100'>
        <div
          onClick={() => {
            useDesigner.getState().selectModel({ id: item.id })
          }}
          style={{ height: `100%`, width: 'calc(100% - 40px)' }}
          className={`${' overflow-auto p-3 '} ${activeModelID === item.id ? 'bg-green-200' : ''}`}
        >
          {item.name}
        </div>
        <div
          onClick={() => {
            useDesigner.getState().removeModel({ id: item.id })
          }}
          className='flex cursor-pointer items-center justify-center bg-red-500 text-white hover:opacity-80 active:bg-red-600'
          style={{ height: `100%`, width: '40px' }}
        >
          X
        </div>
      </div>
    </>
  )
}
