import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root, Element, Text } from "hast"
import { h } from "hastscript"

export const ReikaFix: QuartzTransformerPlugin = () => ({
  name: "ReikaFix",
  htmlPlugins() {
    return [
      () => (tree: Root) => {
        /* 1.  block-id anchors ------------------------------------------------ */
        visit(tree, "text", (node: Text, idx, parent) => {
          const m = node.value.match(/ \^(\w+)$/)
          if (!m) return
          const id = m[1]
          node.value = node.value.replace(/ \^\w+$/, "")
          const anchor = h("a", { id })
          parent!.children.splice(idx! + 1, 0, anchor)
        })

        /* 2.  make every LI that has a nested list collapsible ------------------ */
		visit(tree, "element", (node: Element) => {
		  if (node.tagName !== "li") return

		  // locate the nested <ul>/<ol>
		  const subIdx = node.children.findIndex(
			(c): c is Element =>
			  c.type === "element" && (c.tagName === "ul" || c.tagName === "ol")
		  )
		  if (subIdx === -1) return

		  // grab the first text node to serve as the toggle label
		  const labelIdx = node.children.findIndex(c => c.type === "text")
		  const label = (node.children[labelIdx] as Text).value

		  // build <details> with that label as <summary>
		  const details = h("details", { open: true }, [
			h("summary", label),          // single arrow, no extra bullet
			node.children[subIdx],        // the original <ul>/<ol>
		  ])

		  // replace label + sub-list with the single details element
		  node.children.splice(labelIdx, subIdx - labelIdx + 1, details)
		})
      },
	]
	}
})