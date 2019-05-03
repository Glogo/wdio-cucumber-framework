"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStepArgument = createStepArgument;

require("source-map-support/register");

function createStepArgument({
  argument
}) {
  if (!argument) {
    return undefined;
  }

  if (argument.type === 'DataTable') {
    return [{
      rows: argument.rows.map(row => ({
        cells: row.cells.map(cell => cell.value)
      }))
    }];
  }

  if (argument.type === 'DocString') {
    return argument.content;
  }

  return undefined;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy5qcyJdLCJuYW1lcyI6WyJjcmVhdGVTdGVwQXJndW1lbnQiLCJhcmd1bWVudCIsInVuZGVmaW5lZCIsInR5cGUiLCJyb3dzIiwibWFwIiwicm93IiwiY2VsbHMiLCJjZWxsIiwidmFsdWUiLCJjb250ZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBTyxTQUFTQSxrQkFBVCxDQUE2QjtBQUFFQyxFQUFBQTtBQUFGLENBQTdCLEVBQTJDO0FBQzlDLE1BQUksQ0FBQ0EsUUFBTCxFQUFlO0FBQ1gsV0FBT0MsU0FBUDtBQUNIOztBQUNELE1BQUlELFFBQVEsQ0FBQ0UsSUFBVCxLQUFrQixXQUF0QixFQUFtQztBQUMvQixXQUFPLENBQUM7QUFBRUMsTUFBQUEsSUFBSSxFQUFFSCxRQUFRLENBQUNHLElBQVQsQ0FBY0MsR0FBZCxDQUFrQkMsR0FBRyxLQUFLO0FBQUVDLFFBQUFBLEtBQUssRUFBRUQsR0FBRyxDQUFDQyxLQUFKLENBQVVGLEdBQVYsQ0FBY0csSUFBSSxJQUFJQSxJQUFJLENBQUNDLEtBQTNCO0FBQVQsT0FBTCxDQUFyQjtBQUFSLEtBQUQsQ0FBUDtBQUNIOztBQUNELE1BQUlSLFFBQVEsQ0FBQ0UsSUFBVCxLQUFrQixXQUF0QixFQUFtQztBQUMvQixXQUFPRixRQUFRLENBQUNTLE9BQWhCO0FBQ0g7O0FBQ0QsU0FBT1IsU0FBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN0ZXBBcmd1bWVudCAoeyBhcmd1bWVudCB9KSB7XG4gICAgaWYgKCFhcmd1bWVudCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIGlmIChhcmd1bWVudC50eXBlID09PSAnRGF0YVRhYmxlJykge1xuICAgICAgICByZXR1cm4gW3sgcm93czogYXJndW1lbnQucm93cy5tYXAocm93ID0+ICh7IGNlbGxzOiByb3cuY2VsbHMubWFwKGNlbGwgPT4gY2VsbC52YWx1ZSkgfSkpIH1dXG4gICAgfVxuICAgIGlmIChhcmd1bWVudC50eXBlID09PSAnRG9jU3RyaW5nJykge1xuICAgICAgICByZXR1cm4gYXJndW1lbnQuY29udGVudFxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG4iXX0=