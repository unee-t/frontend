/* global FileReader */
export const imageInputEventHandler = handlerFunc => evt => {
  evt.persist()
  const file = evt.target.files[0]
  const reader = new FileReader()
  reader.onload = evt => {
    const preview = evt.target.result
    handlerFunc(preview, file)
  }
  reader.readAsDataURL(file)
}
