import { PIDEditor } from "../pid/pid-editor.mjs"

export default function (application, element, context, options) {
  PIDEditor.addPIDSheetHeaderButton(application, element)
}