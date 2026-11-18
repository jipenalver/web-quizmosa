import { nextTick } from 'vue'
import { useTheme } from 'vuetify'

// Export PDF on report pages: the browser's print dialog saves the PDF. The page always prints
// in the light theme, and the title becomes the suggested file name. `prepare` runs before
// printing (for example, to show every table row) and returns a function that undoes it.
export function useExportPdf() {
  const theme = useTheme()

  return async (title: string, prepare?: () => () => void) => {
    const previousTheme = theme.global.name.value
    const previousTitle = document.title

    theme.change('light')
    document.title = title
    const restore = prepare?.()
    await nextTick()
    // Let the charts redraw in the light colors before the page is captured.
    await new Promise((resolve) => setTimeout(resolve, 300))

    window.print()

    restore?.()
    document.title = previousTitle
    theme.change(previousTheme)
  }
}
