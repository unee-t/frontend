/* global FileReader, Image */
export const fileInputReaderEventHandler = handlerFunc => evt => {
  evt.persist()
  const file = evt.target.files[0]
  if (!file) return handlerFunc(null, null)

  const reader = new FileReader()
  reader.onload = evt => {
    const content = evt.target.result
    const imgEl = new Image()
    imgEl.onload = evt => {
      handlerFunc(content, file, {
        width: imgEl.width,
        height: imgEl.height
      })
    }
    imgEl.src = content
  }
  reader.readAsDataURL(file)
}
