import { Template } from "./settings";

const CHUNK_SIZE = 400000;

export function concatChunks(template: Template) {
    return template
        .chunk0
        .concat(template.chunk1)
        .concat(template.chunk2)
        .concat(template.chunk3)
        .concat(template.chunk4)
        .concat(template.chunk5)
        .concat(template.chunk6)
        .concat(template.chunk7)
        .concat(template.chunk8)
        .concat(template.chunk9)
}

export function splitToChunks(template: string): string[] {
    if (template.length < CHUNK_SIZE) {
        return [template]
    } else {
        const chunks = [];
        const chunksCount = Math.ceil(template.length / CHUNK_SIZE)
        for(let chunkIndex = 0; chunkIndex <= chunksCount; chunkIndex++ ){
            const chunk = template.slice(chunkIndex * CHUNK_SIZE, Math.min(chunkIndex * CHUNK_SIZE + CHUNK_SIZE, template.length));
            chunks.push[chunk];
        }
    }

}