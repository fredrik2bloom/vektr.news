const ImageOverlay = () => {
  return (
    <div
      className="mix-blend-multuply pointer-events-none absolute inset-0 h-full w-full opacity-20"
      style={{
        backgroundImage: 'url("/static/images/overlay/overlay-1.png")',
        backgroundRepeat: 'repeat',
        backgroundSize: '1000px 1000px',
      }}
    />
  )
}

export default ImageOverlay
