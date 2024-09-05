import { writeFile } from 'fs/promises'
import { resolve } from 'path'

async function main() {
    const width = 500
    const height = 500
    const starts: [number, number, number][] = []
    for (let i = 0; i < width; i++) {
        const x = Math.floor(Math.random() * width)
        const y = Math.floor(Math.abs(gaussianRandom(0, height / 4)))
        const r = Math.floor(gaussianRandom(15, 2)) / 40
        if (y > height) {
            throw new Error(`Fail on ${i}`)
        }
        starts.push([x, y, r])
    }

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}">
            <style>
                circle {
                    stroke: none;
                    fill: rgba(255,255,255,0.25);
                }
            </style>` +
        starts
            .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" />`)
            .join('') +
        '</svg>'

    await writeFile(resolve(__dirname, '../assets/stars.svg'), svg)
}

function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random() //Converting [0,1) to (0,1)
    const v = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean
}

void main()
