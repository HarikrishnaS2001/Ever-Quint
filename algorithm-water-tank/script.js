class WaterTankSolution {
  constructor() {
    this.heights = [];
    this.leftMax = [];
    this.rightMax = [];
    this.waterTrapped = [];
    this.totalWater = 0;
  }

  trap(heights) {
    const n = heights.length;
    if (n === 1 || n === 2) {
      return 0;
    }

    this.heights = [...heights];
    this.leftMax = [];
    this.rightMax = [];
    this.waterTrapped = [];

    // Calculate left maximum array
    this.leftMax.push(0);
    this.leftMax.push(heights[0]);
    for (let i = 2; i < n; i++) {
      this.leftMax.push(
        Math.max(this.leftMax[this.leftMax.length - 1], heights[i - 1]),
      );
    }

    // Calculate right maximum array
    this.rightMax.push(0);
    this.rightMax.push(heights[n - 1]);
    for (let i = n - 2; i >= 0; i--) {
      this.rightMax.push(
        Math.max(this.rightMax[this.rightMax.length - 1], heights[i + 1]),
      );
    }
    this.rightMax.reverse();

    let totalWater = 0;
    for (let i = 0; i < n; i++) {
      const waterLevel =
        Math.min(this.leftMax[i], this.rightMax[i]) - heights[i];
      if (waterLevel > 0) {
        this.waterTrapped.push(waterLevel);
        totalWater += waterLevel;
      } else {
        this.waterTrapped.push(0);
      }
    }

    this.totalWater = totalWater;
    return totalWater;
  }

  getAnalysisData() {
    return this.heights.map((height, index) => ({
      index,
      height,
      leftMax: this.leftMax[index],
      rightMax: this.rightMax[index],
      waterLevel: Math.min(this.leftMax[index], this.rightMax[index]),
      waterTrapped: this.waterTrapped[index],
    }));
  }
}

class WaterTankVisualizer {
  constructor() {
    this.svg = document.getElementById("water-tank-svg");
    this.solution = new WaterTankSolution();
    this.setupEventListeners();

    this.calculateAndVisualize();
  }

  setupEventListeners() {
    const calculateBtn = document.getElementById("calculate-btn");
    const heightsInput = document.getElementById("heights-input");

    calculateBtn.addEventListener("click", () => {
      this.calculateAndVisualize();
    });

    heightsInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.calculateAndVisualize();
      }
    });
  }

  parseInput() {
    const input = document.getElementById("heights-input").value;
    try {
      const heights = input.split(",").map((h) => parseInt(h.trim()));

      if (heights.some((h) => isNaN(h) || h < 0)) {
        throw new Error("Invalid input: Heights must be non-negative integers");
      }

      return heights;
    } catch (error) {
      alert(
        "Please enter valid heights separated by commas (e.g., 0,1,0,2,1,0,1,3,2,1,2,1)",
      );
      return null;
    }
  }

  calculateAndVisualize() {
    const heights = this.parseInput();
    if (!heights) return;

    const totalWater = this.solution.trap(heights);

    document.getElementById("water-result").textContent = totalWater;

    this.createGridVisualization(heights);
  }

  createGridVisualization(heights) {
    const container = document.getElementById("svg-container");
    container.innerHTML = "";

    if (heights.length === 0) return;

    const maxHeight = Math.max(...heights);
    const analysisData = this.solution.getAnalysisData();
    const maxWaterLevel = Math.max(...analysisData.map((d) => d.waterLevel));
    const totalMaxHeight = Math.max(maxHeight, maxWaterLevel);

    const gridWrapper = document.createElement("div");
    gridWrapper.style.textAlign = "center";

    const title = document.createElement("h4");
    title.textContent = `Input: [${heights.join(",")}]`;
    title.style.marginBottom = "10px";
    title.style.color = "#333";
    gridWrapper.appendChild(title);

    const resultTitle = document.createElement("h4");
    resultTitle.textContent = `Output: ${this.solution.totalWater} Units`;
    resultTitle.style.marginBottom = "20px";
    resultTitle.style.color = "#4CAF50";
    gridWrapper.appendChild(resultTitle);

    // Create container with axes
    const gridWithAxes = document.createElement("div");
    gridWithAxes.className = "grid-with-axes";

    // Create Y-axis labels
    const yAxisContainer = document.createElement("div");
    yAxisContainer.className = "y-axis-labels";

    for (let row = totalMaxHeight; row > 0; row--) {
      const yLabel = document.createElement("div");
      yLabel.className = "y-axis-label";
      yLabel.textContent = row;
      yAxisContainer.appendChild(yLabel);
    }

    const gridMain = document.createElement("div");
    gridMain.className = "grid-main";

    for (let row = totalMaxHeight; row > 0; row--) {
      const gridRow = document.createElement("div");
      gridRow.className = "grid-row";

      heights.forEach((height, colIndex) => {
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        const waterLevel = analysisData[colIndex].waterLevel;

        if (row <= height) {
          // Wall/Ground block
          cell.classList.add("cell-wall");
        } else if (row <= waterLevel) {
          // Water block
          cell.classList.add("cell-water");
        } else {
          // Empty block
          cell.classList.add("cell-empty");
        }

        gridRow.appendChild(cell);
      });

      gridMain.appendChild(gridRow);
    }

    // Add components to grid with axes
    gridWithAxes.appendChild(yAxisContainer);
    gridWithAxes.appendChild(gridMain);

    // Add index labels (X-axis) at bottom
    const indexContainer = document.createElement("div");
    indexContainer.className = "index-labels";

    heights.forEach((height, index) => {
      const indexLabel = document.createElement("div");
      indexLabel.className = "index-label";
      indexLabel.textContent = index;
      indexContainer.appendChild(indexLabel);
    });

    gridWrapper.appendChild(gridWithAxes);
    gridWrapper.appendChild(indexContainer);
    container.appendChild(gridWrapper);
  }

  updateAnalysisTable() {
    const tableBody = document.querySelector("#analysis-table tbody");
    tableBody.innerHTML = "";

    const analysisData = this.solution.getAnalysisData();

    analysisData.forEach((data) => {
      const row = document.createElement("tr");

      const cells = [
        data.index,
        data.height,
        data.leftMax,
        data.rightMax,
        data.waterLevel,
        data.waterTrapped,
      ];

      cells.forEach((cellData, index) => {
        const cell = document.createElement("td");
        cell.textContent = cellData;

        // Highlight water trapped amounts
        if (index === 5) {
          if (cellData > 0) {
            cell.classList.add("water-amount");
          } else {
            cell.classList.add("no-water");
          }
        }

        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new WaterTankVisualizer();
});
