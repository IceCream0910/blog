import { NotionGraph } from "@graphcentral/notion-graph-scraper"
import fs from "fs"
    /**
     * example of how to use `@graphcentral/notion-graph-scraper`
     */
    ; (async () => {
        const notionGraph = new NotionGraph({
            maxDiscoverableNodes: 5000,
            maxDiscoverableNodesInOtherSpaces: 5000,
            maxDiscoverableNodesInOtherSpaces: 15,
            verbose: true,
        })
        const graph = await notionGraph.buildGraphFromRootNode(
            `1a346171ed574b0a9c1c3f5a29b39919`
        )
        console.log(graph.nodes.length)
        console.log(graph.links.length)
        await new Promise((resolve, reject) => {
            fs.writeFile(`test0.json`, JSON.stringify(graph), (err) => {
                if (err) reject(err)
                else resolve(``)
            })
        });

        process.exit(0)
    })()
