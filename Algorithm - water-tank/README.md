# Water Tank Problem - Trapping Rain Water

A visual implementation of LeetCode Problem 42: Trapping Rain Water using vanilla JavaScript, HTML, and CSS.

## Problem Description

Given an array of non-negative integers representing the height of blocks, compute the units of water that can be stored between the blocks after it rains.

## Algorithm

The solution uses the approach from the provided C++ implementation:

1. **Left Maximum Array**: For each position, calculate the maximum height to its left
2. **Right Maximum Array**: For each position, calculate the maximum height to its right
3. **Water Calculation**: Water trapped at position i = min(left_max[i], right_max[i]) - height[i]
4. **Sum**: Add all positive water values to get the total trapped water

## Features

- **Interactive Input**: Enter custom height arrays
- **SVG Visualization**: Visual representation with bars and water
- **Step-by-step Analysis**: Detailed table showing calculations for each position
- **Responsive Design**: Works on desktop and mobile devices
- **Algorithm Explanation**: Built-in explanation of the approach

## Usage

1. Open `index.html` in your web browser
2. Enter heights separated by commas (e.g., `0,1,0,2,1,0,1,3,2,1,2,1`)
3. Click "Calculate Water Trapped" or press Enter
4. View the result and visualization

## Examples

### Example 1

**Input**: `[0,1,0,2,1,0,1,3,2,1,2,1]`
**Output**: `6 units`

### Example 2

**Input**: `[3,0,2,0,4]`
**Output**: `7 units`

### Example 3

**Input**: `[0,1,0,0,0,6,0,6,4,0]`
**Output**: `18 units`

## Files Structure

```
algorithm-water-tank/
├── index.html      # Main HTML structure
├── styles.css      # Styling and layout
├── script.js       # JavaScript implementation
└── README.md       # This documentation
```

## Technical Details

- **Language**: Vanilla JavaScript (ES6+)
- **Visualization**: SVG with dynamic generation
- **Algorithm Complexity**:
  - Time: O(n) where n is the length of the input array
  - Space: O(n) for the left and right maximum arrays

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## How It Works

The visualization uses:

- **Brown bars**: Represent the building/wall heights
- **Blue areas**: Represent trapped water
- **Numbers on bars**: Show the height values
- **Numbers in water**: Show water amount at each position
- **Grid lines**: Help visualize the height scale

The table below the visualization shows the step-by-step calculation including left max, right max, water level, and water trapped for each position.

## Original C++ Implementation

The JavaScript solution is based on this C++ code:

```cpp
class Solution {
public:
    int trap(vector<int>& height) {
        int n=height.size();
        if(n==1 || n==2)
        return 0;

        int ans=0;

        vector<int> lm,rm;
        lm.push_back(0);
        lm.push_back(height[0]);
        for(int i=2;i<n;i++){
            lm.push_back(max(lm[lm.size()-1],height[i-1]));
        }
        rm.push_back(0);
        rm.push_back(height[n-1]);
        for(int i=n-2;i>=0;i--){
            rm.push_back(max(rm[rm.size()-1],height[i+1]));
        }
        reverse(rm.begin(),rm.end());

        for(int i=0;i<n;i++){
            if((min(lm[i],rm[i])-height[i]) >0)
            ans+=(min(lm[i],rm[i])-height[i]);
        }
        return ans;
    }
};
```
