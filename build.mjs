import {readFile, writeFile} from "fs/promises"
import marked from "marked"

const source = await readFile("source.md", {encoding: "utf8"})

const readme = source.replace(/^<iframe.*\n\n/m, "")
await writeFile("README.md", readme)

const frame = await readFile("frame.html", {encoding: "utf8"})
const title = source.match(/^# (?<title>.*)$/m).groups.title
const body = marked(source.replace(/<figure.*\n.*\n.*youtube.*\n.*\n.*\n.*figure>\n\n/m, ""))
const html = frame
.replaceAll("{{title}}", title)
.replaceAll("{{desc}}", "Elképesztő megoldások az előválasztás informatikai rendszerében")
.replaceAll("{{url}}", "https://mlaci.github.io/elovalasztas/")
.replace("{{body}}", body)

await writeFile("index.html", html)