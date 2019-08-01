/* global FileReader */
export const fileInputReaderEventHandler = handlerFunc => evt => {
  evt.persist()
  const file = evt.target.files[0]
  if (!file) return handlerFunc(null, null)

  const reader = new FileReader()
  reader.onload = evt => {
    const content = evt.target.result
    handlerFunc(content, file)
  }
  reader.readAsDataURL(file)
}
