export function exportToSVG(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  // Remove interactive elements
  clone.querySelectorAll('[data-testid]').forEach((el) => el.remove())
  clone.querySelectorAll('.tl-selection-aux').forEach((el) => el.remove())
  clone.querySelectorAll('.tl-overlays').forEach((el) => el.remove())
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('font-family', 'Arial, sans-serif')
  return new XMLSerializer().serializeToString(clone)
}
