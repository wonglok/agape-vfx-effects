import Link from 'next/link'

export default function Page() {
  return (
    <>
      <div className=''>
        <div className='mb-2 p-2'>AGAPE ENGINE - Effects</div>
        <Link href={`/designer`}>
          <div className='mb-2 p-2'>Designer Preview Tool</div>
        </Link>
      </div>
    </>
  )
}
