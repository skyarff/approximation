self.onmessage = function(e) {
    const { rowsBuffer, pivotRowBuffer, pivotIndex, n, startRow, endRow } = e.data;
    const rows = new Float64Array(rowsBuffer);
    const pivotRow = new Float64Array(pivotRowBuffer);
    const numRows = rows.length / (n + 1);
    const results = [];
    
    for (let j = 0; j < numRows; j++) {
        const rowStart = j * (n + 1);
        const factor = rows[rowStart + pivotIndex];
        
        for (let k = pivotIndex; k <= n; k++) {
            rows[rowStart + k] -= factor * pivotRow[k];
        }
        
        const resultRow = new Float64Array(n + 1);
        for (let k = 0; k <= n; k++) {
            resultRow[k] = rows[rowStart + k];
        }
        results.push(resultRow.buffer);
    }
    
    self.postMessage({ results }, results);
};