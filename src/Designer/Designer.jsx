import { Canvas } from '@react-three/fiber'
import { useDesigner } from './useDesigner.js'
import { useEffect } from 'react'
import md5 from 'md5'
import { Models } from './Models.jsx'
import { ActiveModel } from './ActiveModel.jsx'
import { Parts } from './Parts.jsx'

export const Designer = () => {
  useEffect(() => {
    useDesigner.getState().hydrate()
  }, [])
  return (
    <>
      <div className='flex h-full w-full'>
        <div className='bg-purple-300' style={{ height: `100%`, width: `280px` }}>
          <Models></Models>
          {/* <div className='bg-gray-200 p-2 text-center'>Material Previews</div> */}
        </div>
        {/*  */}
        <div className='' style={{ height: `100%`, width: `calc(100% - 280px - 280px)` }}>
          <div className='h-full w-full'>
            <Canvas>
              <ActiveModel></ActiveModel>
            </Canvas>
          </div>
        </div>
        <div className='bg-purple-300' style={{ height: `100%`, width: `280px` }}>
          <div className='h-full w-full'>
            <Parts></Parts>
          </div>
        </div>
      </div>
      {/*  */}
    </>
  )
}
