// Shared random helpers & city constants reused by components
export const rand = (a, b) => a + Math.random() * (b - a)
export const randI = (a, b) => Math.floor(rand(a, b + 1))
export const pick = arr => arr[Math.floor(Math.random() * arr.length)]

export const GRID_COUNT = 11
export const BLOCK_SIZE = 18
export const GAP_SIZE = 5
export const CELL = BLOCK_SIZE + GAP_SIZE
export const CITY_OFFSET = ((GRID_COUNT - 1) / 2) * CELL

export const EDGE_COLORS = [0x00ffe7, 0xff00cc, 0xff6600, 0x3399ff, 0xffee00, 0x00ff88]

export const BUILDING_COLORS = [
    0x0d1a2a, 0x111820, 0x0a1510, 0x1a1020, 0x0c0c18,
]
