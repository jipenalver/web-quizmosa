import { nextTick } from 'vue'
import { useTheme } from 'vuetify'

// Export PDF on report pages: the browser's print dialog saves the PDF. The page always prints
// in the light theme, and the title becomes the suggested file name. `prepare` runs before
// printing (for example, to show every table row) and returns a function that undoes it.
// Add `print-full-width` to a column that should span the page in the PDF.
export function useExportPdf() {
  const theme = useTheme()

  return async (title: string, prepare?: () => () => void) => {
    const previousTheme = theme.global.name.value
    const previousTitle = document.title

    theme.change('light')
    document.title = title
    // Narrows the page to paper width (see base.css), so charts redraw at print size.
    document.documentElement.classList.add('exporting-pdf')
    const restore = prepare?.()
    await nextTick()
    // Let the charts redraw in the light colors and the new width before the page is captured.
    await new Promise((resolve) => setTimeout(resolve, 500))

    // A viewBox lets each chart scale to the full paper width instead of keeping its pixel size.
    const charts = [...document.querySelectorAll<SVGSVGElement>('.apexcharts-canvas > svg')]
    for (const svg of charts) {
      svg.setAttribute('viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`)
    }

    window.print()

    for (const svg of charts) svg.removeAttribute('viewBox')
    document.documentElement.classList.remove('exporting-pdf')
    restore?.()
    document.title = previousTitle
    theme.change(previousTheme)
  }
}
