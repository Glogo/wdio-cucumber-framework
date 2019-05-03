"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compareScenarioLineWithSourceLine = compareScenarioLineWithSourceLine;
exports.getStepFromFeature = getStepFromFeature;
exports.CucumberEventListener = void 0;

require("source-map-support/register");

var _events = require("events");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class CucumberEventListener extends _events.EventEmitter {
  constructor(eventBroadcaster) {
    super(); // attachEventLogger(eventBroadcaster)

    _defineProperty(this, "gherkinDocEvents", []);

    _defineProperty(this, "acceptedPickles", []);

    _defineProperty(this, "currentPickle", null);

    _defineProperty(this, "testCasePreparedEvents", []);

    eventBroadcaster.on('gherkin-document', this.onGherkinDocument.bind(this)).on('pickle-accepted', this.onPickleAccepted.bind(this)).on('test-case-prepared', this.onTestCasePrepared.bind(this)).on('test-case-started', this.onTestCaseStarted.bind(this)).on('test-step-started', this.onTestStepStarted.bind(this)).on('test-step-finished', this.onTestStepFinished.bind(this)).on('test-case-finished', this.onTestCaseFinished.bind(this)).on('test-run-finished', this.onTestRunFinished.bind(this));
  } // gherkinDocEvent = {
  //     uri: string,
  //     document: {
  //         type: 'GherkinDocument',
  //         feature: {
  //             type: 'Feature',
  //             tags: [{ name: string }],
  //             location: { line: 0, column: 0 },
  //             language: string,
  //             keyword: 'Feature',
  //             name: string,
  //             description: string,
  //             children: [{
  //                 type: 'Scenario',
  //                 tags: [],
  //                 location: { line: 0, column: 0 },
  //                 keyword: 'Scenario',
  //                 name: string,
  //                 steps: [{
  //                     type: 'Step',
  //                     location: { line: 0, column: 0 },
  //                     keyword: 'Given' | 'When' | 'Then',
  //                     text: string
  //                 }]
  //             }]
  //         }
  //     },
  //     comments: [{
  //         type: 'Comment',
  //         location: { line: 0, column: 0 },
  //         text: string
  //     }]
  // }


  onGherkinDocument(gherkinDocEvent) {
    this.gherkinDocEvents.push(gherkinDocEvent);
    const uri = gherkinDocEvent.uri;
    const doc = gherkinDocEvent.document;
    const feature = doc.feature;
    this.emit('before-feature', uri, feature);
  } // pickleEvent = {
  //     uri: string,
  //     pickle: {
  //         tags: [{ name: string }],
  //         name: string,
  //         locations: [{ line: 0, column: 0 }],
  //         steps: [{
  //             locations: [{ line: 0, column: 0 }],
  //             keyword: 'Given' | 'When' | 'Then',
  //             text: string
  //         }]
  //     }
  // }


  onPickleAccepted(pickleEvent) {
    // because 'pickle-accepted' events are emitted together in forEach loop
    this.acceptedPickles.push(pickleEvent);
  }

  onTestCaseStarted() {
    const pickleEvent = this.acceptedPickles.shift();
    const uri = pickleEvent.uri;
    const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document;
    const feature = doc.feature;
    const scenario = pickleEvent.pickle;
    this.currentPickle = scenario;
    this.emit('before-scenario', uri, feature, scenario);
  } // testStepStartedEvent = {
  //     index: 0,
  //     testCase: {
  //         sourceLocation: { uri: string, line: 0 }
  //     }
  // }


  onTestStepStarted(testStepStartedEvent) {
    const sourceLocation = testStepStartedEvent.testCase.sourceLocation;
    const uri = sourceLocation.uri;
    const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document;
    const feature = doc.feature;
    const scenario = feature.children.find(child => compareScenarioLineWithSourceLine(child, sourceLocation));
    const step = getStepFromFeature(feature, this.currentPickle, testStepStartedEvent.index, sourceLocation);
    this.emit('before-step', uri, feature, scenario, step, sourceLocation);
  } // testCasePreparedEvent = {
  //     sourceLocation: { uri: string, line: 0 }
  //     steps: [
  //         {
  //             actionLocation: {
  //                 uri: string
  //                 line: 0
  //             }
  //         }
  //     ]
  // }


  onTestCasePrepared(testCasePreparedEvent) {
    this.testCasePreparedEvents.push(testCasePreparedEvent);
    const sourceLocation = testCasePreparedEvent.sourceLocation;
    const uri = sourceLocation.uri;
    const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document;
    const scenario = doc.feature.children.find(child => compareScenarioLineWithSourceLine(child, sourceLocation));
    const scenarioHasHooks = scenario.steps.filter(step => step.type === 'Hook').length > 0;

    if (scenarioHasHooks) {
      return;
    }

    const allSteps = testCasePreparedEvent.steps;
    allSteps.forEach((step, idx) => {
      if (!step.sourceLocation) {
        step.sourceLocation = {
          line: step.actionLocation.line,
          column: 0,
          uri: step.actionLocation.uri
        };
        const hook = {
          type: 'Hook',
          location: step.sourceLocation,
          keyword: 'Hook',
          text: ''
        };
        scenario.steps.splice(idx, 0, hook);
      }
    });
  } // testStepFinishedEvent = {
  //     index: 0,
  //     result: { duration: 0, status: string, exception?: Error },
  //     testCase: {
  //         sourceLocation: { uri: string, line: 0 }
  //     }
  // }


  onTestStepFinished(testStepFinishedEvent) {
    const sourceLocation = testStepFinishedEvent.testCase.sourceLocation;
    const uri = sourceLocation.uri;
    const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document;
    const feature = doc.feature;
    const scenario = feature.children.find(child => compareScenarioLineWithSourceLine(child, sourceLocation));
    const step = getStepFromFeature(feature, this.currentPickle, testStepFinishedEvent.index, sourceLocation);
    const result = testStepFinishedEvent.result;
    this.emit('after-step', uri, feature, scenario, step, result, sourceLocation);
  } // testCaseFinishedEvent = {
  //     result: { duration: 0, status: string },
  //     sourceLocation: { uri: string, line: 0 }
  // }


  onTestCaseFinished(testCaseFinishedEvent) {
    const sourceLocation = testCaseFinishedEvent.sourceLocation;
    const uri = sourceLocation.uri;
    const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document;
    const feature = doc.feature;
    const scenario = feature.children.find(child => compareScenarioLineWithSourceLine(child, sourceLocation));
    this.emit('after-scenario', uri, feature, scenario, sourceLocation);
    this.currentPickle = null;
  } // testRunFinishedEvent = {
  //     result: { duration: 4004, success: true }
  // }


  onTestRunFinished() {
    const gherkinDocEvent = this.gherkinDocEvents.pop(); // see .push() in `handleBeforeFeature()`

    const uri = gherkinDocEvent.uri;
    const doc = gherkinDocEvent.document;
    const feature = doc.feature;
    this.emit('after-feature', uri, feature);
  }

}

exports.CucumberEventListener = CucumberEventListener;

function compareScenarioLineWithSourceLine(scenario, sourceLocation) {
  if (scenario.type.indexOf('ScenarioOutline') > -1) {
    return scenario.examples[0].tableBody.some(tableEntry => tableEntry.location.line === sourceLocation.line);
  } else {
    return scenario.location.line === sourceLocation.line;
  }
}

function getStepFromFeature(feature, pickle, stepIndex, sourceLocation) {
  let combinedSteps = [];
  feature.children.forEach(child => {
    if (child.type.indexOf('Scenario') > -1 && !compareScenarioLineWithSourceLine(child, sourceLocation)) {
      return;
    }

    combinedSteps = combinedSteps.concat(child.steps);
  });
  const targetStep = combinedSteps[stepIndex];

  if (targetStep.type === 'Step') {
    const stepLine = targetStep.location.line;
    const pickleStep = pickle.steps.find(s => s.locations.some(loc => loc.line === stepLine));

    if (pickleStep) {
      return _objectSpread({}, targetStep, {
        text: pickleStep.text
      });
    }
  }

  return targetStep;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9DdWN1bWJlckV2ZW50TGlzdGVuZXIuanMiXSwibmFtZXMiOlsiQ3VjdW1iZXJFdmVudExpc3RlbmVyIiwiRXZlbnRFbWl0dGVyIiwiY29uc3RydWN0b3IiLCJldmVudEJyb2FkY2FzdGVyIiwib24iLCJvbkdoZXJraW5Eb2N1bWVudCIsImJpbmQiLCJvblBpY2tsZUFjY2VwdGVkIiwib25UZXN0Q2FzZVByZXBhcmVkIiwib25UZXN0Q2FzZVN0YXJ0ZWQiLCJvblRlc3RTdGVwU3RhcnRlZCIsIm9uVGVzdFN0ZXBGaW5pc2hlZCIsIm9uVGVzdENhc2VGaW5pc2hlZCIsIm9uVGVzdFJ1bkZpbmlzaGVkIiwiZ2hlcmtpbkRvY0V2ZW50IiwiZ2hlcmtpbkRvY0V2ZW50cyIsInB1c2giLCJ1cmkiLCJkb2MiLCJkb2N1bWVudCIsImZlYXR1cmUiLCJlbWl0IiwicGlja2xlRXZlbnQiLCJhY2NlcHRlZFBpY2tsZXMiLCJzaGlmdCIsImZpbmQiLCJnZGUiLCJzY2VuYXJpbyIsInBpY2tsZSIsImN1cnJlbnRQaWNrbGUiLCJ0ZXN0U3RlcFN0YXJ0ZWRFdmVudCIsInNvdXJjZUxvY2F0aW9uIiwidGVzdENhc2UiLCJjaGlsZHJlbiIsImNoaWxkIiwiY29tcGFyZVNjZW5hcmlvTGluZVdpdGhTb3VyY2VMaW5lIiwic3RlcCIsImdldFN0ZXBGcm9tRmVhdHVyZSIsImluZGV4IiwidGVzdENhc2VQcmVwYXJlZEV2ZW50IiwidGVzdENhc2VQcmVwYXJlZEV2ZW50cyIsInNjZW5hcmlvSGFzSG9va3MiLCJzdGVwcyIsImZpbHRlciIsInR5cGUiLCJsZW5ndGgiLCJhbGxTdGVwcyIsImZvckVhY2giLCJpZHgiLCJsaW5lIiwiYWN0aW9uTG9jYXRpb24iLCJjb2x1bW4iLCJob29rIiwibG9jYXRpb24iLCJrZXl3b3JkIiwidGV4dCIsInNwbGljZSIsInRlc3RTdGVwRmluaXNoZWRFdmVudCIsInJlc3VsdCIsInRlc3RDYXNlRmluaXNoZWRFdmVudCIsInBvcCIsImluZGV4T2YiLCJleGFtcGxlcyIsInRhYmxlQm9keSIsInNvbWUiLCJ0YWJsZUVudHJ5Iiwic3RlcEluZGV4IiwiY29tYmluZWRTdGVwcyIsImNvbmNhdCIsInRhcmdldFN0ZXAiLCJzdGVwTGluZSIsInBpY2tsZVN0ZXAiLCJzIiwibG9jYXRpb25zIiwibG9jIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7Ozs7QUFFTyxNQUFNQSxxQkFBTixTQUFvQ0Msb0JBQXBDLENBQWlEO0FBTXBEQyxFQUFBQSxXQUFXLENBQUVDLGdCQUFGLEVBQW9CO0FBQzNCLFlBRDJCLENBRTNCOztBQUYyQiw4Q0FMWixFQUtZOztBQUFBLDZDQUpiLEVBSWE7O0FBQUEsMkNBSGYsSUFHZTs7QUFBQSxvREFGTixFQUVNOztBQUkzQkEsSUFBQUEsZ0JBQWdCLENBQ1hDLEVBREwsQ0FDUSxrQkFEUixFQUM0QixLQUFLQyxpQkFBTCxDQUF1QkMsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FENUIsRUFFS0YsRUFGTCxDQUVRLGlCQUZSLEVBRTJCLEtBQUtHLGdCQUFMLENBQXNCRCxJQUF0QixDQUEyQixJQUEzQixDQUYzQixFQUdLRixFQUhMLENBR1Esb0JBSFIsRUFHOEIsS0FBS0ksa0JBQUwsQ0FBd0JGLElBQXhCLENBQTZCLElBQTdCLENBSDlCLEVBSUtGLEVBSkwsQ0FJUSxtQkFKUixFQUk2QixLQUFLSyxpQkFBTCxDQUF1QkgsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FKN0IsRUFLS0YsRUFMTCxDQUtRLG1CQUxSLEVBSzZCLEtBQUtNLGlCQUFMLENBQXVCSixJQUF2QixDQUE0QixJQUE1QixDQUw3QixFQU1LRixFQU5MLENBTVEsb0JBTlIsRUFNOEIsS0FBS08sa0JBQUwsQ0FBd0JMLElBQXhCLENBQTZCLElBQTdCLENBTjlCLEVBT0tGLEVBUEwsQ0FPUSxvQkFQUixFQU84QixLQUFLUSxrQkFBTCxDQUF3Qk4sSUFBeEIsQ0FBNkIsSUFBN0IsQ0FQOUIsRUFRS0YsRUFSTCxDQVFRLG1CQVJSLEVBUTZCLEtBQUtTLGlCQUFMLENB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QXZCLENBQW5COztBQUVBLFFBQUlDLFVBQUosRUFBZ0I7QUFDWiwrQkFBWUYsVUFBWjtBQUF3QmQsUUFBQUEsSUFBSSxFQUFFZ0IsVUFBVSxDQUFDaEI7QUFBekM7QUFDSDtBQUNKOztBQUVELFNBQU9jLFVBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cydcblxuZXhwb3J0IGNsYXNzIEN1Y3VtYmVyRXZlbnRMaXN0ZW5lciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgZ2hlcmtpbkRvY0V2ZW50cyA9IFtdXG4gICAgYWNjZXB0ZWRQaWNrbGVzID0gW11cbiAgICBjdXJyZW50UGlja2xlID0gbnVsbFxuICAgIHRlc3RDYXNlUHJlcGFyZWRFdmVudHMgPSBbXVxuXG4gICAgY29uc3RydWN0b3IgKGV2ZW50QnJvYWRjYXN0ZXIpIHtcbiAgICAgICAgc3VwZXIoKVxuICAgICAgICAvLyBhdHRhY2hFdmVudExvZ2dlcihldmVudEJyb2FkY2FzdGVyKVxuXG4gICAgICAgIGV2ZW50QnJvYWRjYXN0ZXJcbiAgICAgICAgICAgIC5vbignZ2hlcmtpbi1kb2N1bWVudCcsIHRoaXMub25HaGVya2luRG9jdW1lbnQuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbigncGlja2xlLWFjY2VwdGVkJywgdGhpcy5vblBpY2tsZUFjY2VwdGVkLmJpbmQodGhpcykpXG4gICAgICAgICAgICAub24oJ3Rlc3QtY2FzZS1wcmVwYXJlZCcsIHRoaXMub25UZXN0Q2FzZVByZXBhcmVkLmJpbmQodGhpcykpXG4gICAgICAgICAgICAub24oJ3Rlc3QtY2FzZS1zdGFydGVkJywgdGhpcy5vblRlc3RDYXNlU3RhcnRlZC5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKCd0ZXN0LXN0ZXAtc3RhcnRlZCcsIHRoaXMub25UZXN0U3RlcFN0YXJ0ZWQuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbigndGVzdC1zdGVwLWZpbmlzaGVkJywgdGhpcy5vblRlc3RTdGVwRmluaXNoZWQuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbigndGVzdC1jYXNlLWZpbmlzaGVkJywgdGhpcy5vblRlc3RDYXNlRmluaXNoZWQuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbigndGVzdC1ydW4tZmluaXNoZWQnLCB0aGlzLm9uVGVzdFJ1bkZpbmlzaGVkLmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgLy8gZ2hlcmtpbkRvY0V2ZW50ID0ge1xuICAgIC8vICAgICB1cmk6IHN0cmluZyxcbiAgICAvLyAgICAgZG9jdW1lbnQ6IHtcbiAgICAvLyAgICAgICAgIHR5cGU6ICdHaGVya2luRG9jdW1lbnQnLFxuICAgIC8vICAgICAgICAgZmVhdHVyZToge1xuICAgIC8vICAgICAgICAgICAgIHR5cGU6ICdGZWF0dXJlJyxcbiAgICAvLyAgICAgICAgICAgICB0YWdzOiBbeyBuYW1lOiBzdHJpbmcgfV0sXG4gICAgLy8gICAgICAgICAgICAgbG9jYXRpb246IHsgbGluZTogMCwgY29sdW1uOiAwIH0sXG4gICAgLy8gICAgICAgICAgICAgbGFuZ3VhZ2U6IHN0cmluZyxcbiAgICAvLyAgICAgICAgICAgICBrZXl3b3JkOiAnRmVhdHVyZScsXG4gICAgLy8gICAgICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgIC8vICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgLy8gICAgICAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgLy8gICAgICAgICAgICAgICAgIHR5cGU6ICdTY2VuYXJpbycsXG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ3M6IFtdLFxuICAgIC8vICAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyBsaW5lOiAwLCBjb2x1bW46IDAgfSxcbiAgICAvLyAgICAgICAgICAgICAgICAga2V5d29yZDogJ1NjZW5hcmlvJyxcbiAgICAvLyAgICAgICAgICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgIC8vICAgICAgICAgICAgICAgICBzdGVwczogW3tcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdTdGVwJyxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiB7IGxpbmU6IDAsIGNvbHVtbjogMCB9LFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAga2V5d29yZDogJ0dpdmVuJyB8ICdXaGVuJyB8ICdUaGVuJyxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHN0cmluZ1xuICAgIC8vICAgICAgICAgICAgICAgICB9XVxuICAgIC8vICAgICAgICAgICAgIH1dXG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH0sXG4gICAgLy8gICAgIGNvbW1lbnRzOiBbe1xuICAgIC8vICAgICAgICAgdHlwZTogJ0NvbW1lbnQnLFxuICAgIC8vICAgICAgICAgbG9jYXRpb246IHsgbGluZTogMCwgY29sdW1uOiAwIH0sXG4gICAgLy8gICAgICAgICB0ZXh0OiBzdHJpbmdcbiAgICAvLyAgICAgfV1cbiAgICAvLyB9XG4gICAgb25HaGVya2luRG9jdW1lbnQgKGdoZXJraW5Eb2NFdmVudCkge1xuICAgICAgICB0aGlzLmdoZXJraW5Eb2NFdmVudHMucHVzaChnaGVya2luRG9jRXZlbnQpXG5cbiAgICAgICAgY29uc3QgdXJpID0gZ2hlcmtpbkRvY0V2ZW50LnVyaVxuICAgICAgICBjb25zdCBkb2MgPSBnaGVya2luRG9jRXZlbnQuZG9jdW1lbnRcbiAgICAgICAgY29uc3QgZmVhdHVyZSA9IGRvYy5mZWF0dXJlXG5cbiAgICAgICAgdGhpcy5lbWl0KCdiZWZvcmUtZmVhdHVyZScsIHVyaSwgZmVhdHVyZSlcbiAgICB9XG5cbiAgICAvLyBwaWNrbGVFdmVudCA9IHtcbiAgICAvLyAgICAgdXJpOiBzdHJpbmcsXG4gICAgLy8gICAgIHBpY2tsZToge1xuICAgIC8vICAgICAgICAgdGFnczogW3sgbmFtZTogc3RyaW5nIH1dLFxuICAgIC8vICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgIC8vICAgICAgICAgbG9jYXRpb25zOiBbeyBsaW5lOiAwLCBjb2x1bW46IDAgfV0sXG4gICAgLy8gICAgICAgICBzdGVwczogW3tcbiAgICAvLyAgICAgICAgICAgICBsb2NhdGlvbnM6IFt7IGxpbmU6IDAsIGNvbHVtbjogMCB9XSxcbiAgICAvLyAgICAgICAgICAgICBrZXl3b3JkOiAnR2l2ZW4nIHwgJ1doZW4nIHwgJ1RoZW4nLFxuICAgIC8vICAgICAgICAgICAgIHRleHQ6IHN0cmluZ1xuICAgIC8vICAgICAgICAgfV1cbiAgICAvLyAgICAgfVxuICAgIC8vIH1cbiAgICBvblBpY2tsZUFjY2VwdGVkIChwaWNrbGVFdmVudCkge1xuICAgICAgICAvLyBiZWNhdXNlICdwaWNrbGUtYWNjZXB0ZWQnIGV2ZW50cyBhcmUgZW1pdHRlZCB0b2dldGhlciBpbiBmb3JFYWNoIGxvb3BcbiAgICAgICAgdGhpcy5hY2NlcHRlZFBpY2tsZXMucHVzaChwaWNrbGVFdmVudClcbiAgICB9XG5cbiAgICBvblRlc3RDYXNlU3RhcnRlZCAoKSB7XG4gICAgICAgIGNvbnN0IHBpY2tsZUV2ZW50ID0gdGhpcy5hY2NlcHRlZFBpY2tsZXMuc2hpZnQoKVxuICAgICAgICBjb25zdCB1cmkgPSBwaWNrbGVFdmVudC51cmlcbiAgICAgICAgY29uc3QgZG9jID0gdGhpcy5naGVya2luRG9jRXZlbnRzLmZpbmQoZ2RlID0+IGdkZS51cmkgPT09IHVyaSkuZG9jdW1lbnRcbiAgICAgICAgY29uc3QgZmVhdHVyZSA9IGRvYy5mZWF0dXJlXG4gICAgICAgIGNvbnN0IHNjZW5hcmlvID0gcGlja2xlRXZlbnQucGlja2xlXG5cbiAgICAgICAgdGhpcy5jdXJyZW50UGlja2xlID0gc2NlbmFyaW9cblxuICAgICAgICB0aGlzLmVtaXQoJ2JlZm9yZS1zY2VuYXJpbycsIHVyaSwgZmVhdHVyZSwgc2NlbmFyaW8pXG4gICAgfVxuXG4gICAgLy8gdGVzdFN0ZXBTdGFydGVkRXZlbnQgPSB7XG4gICAgLy8gICAgIGluZGV4OiAwLFxuICAgIC8vICAgICB0ZXN0Q2FzZToge1xuICAgIC8vICAgICAgICAgc291cmNlTG9jYXRpb246IHsgdXJpOiBzdHJpbmcsIGxpbmU6IDAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gfVxuICAgIG9uVGVzdFN0ZXBTdGFydGVkICh0ZXN0U3RlcFN0YXJ0ZWRFdmVudCkge1xuICAgICAgICBjb25zdCBzb3VyY2VMb2NhdGlvbiA9IHRlc3RTdGVwU3RhcnRlZEV2ZW50LnRlc3RDYXNlLnNvdXJjZUxvY2F0aW9uXG4gICAgICAgIGNvbnN0IHVyaSA9IHNvdXJjZUxvY2F0aW9uLnVyaVxuXG4gICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuZ2hlcmtpbkRvY0V2ZW50cy5maW5kKGdkZSA9PiBnZGUudXJpID09PSB1cmkpLmRvY3VtZW50XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBkb2MuZmVhdHVyZVxuICAgICAgICBjb25zdCBzY2VuYXJpbyA9IGZlYXR1cmUuY2hpbGRyZW4uZmluZCgoY2hpbGQpID0+IGNvbXBhcmVTY2VuYXJpb0xpbmVXaXRoU291cmNlTGluZShjaGlsZCwgc291cmNlTG9jYXRpb24pKVxuICAgICAgICBjb25zdCBzdGVwID0gZ2V0U3RlcEZyb21GZWF0dXJlKGZlYXR1cmUsIHRoaXMuY3VycmVudFBpY2tsZSwgdGVzdFN0ZXBTdGFydGVkRXZlbnQuaW5kZXgsIHNvdXJjZUxvY2F0aW9uKVxuXG4gICAgICAgIHRoaXMuZW1pdCgnYmVmb3JlLXN0ZXAnLCB1cmksIGZlYXR1cmUsIHNjZW5hcmlvLCBzdGVwLCBzb3VyY2VMb2NhdGlvbilcbiAgICB9XG5cbiAgICAvLyB0ZXN0Q2FzZVByZXBhcmVkRXZlbnQgPSB7XG4gICAgLy8gICAgIHNvdXJjZUxvY2F0aW9uOiB7IHVyaTogc3RyaW5nLCBsaW5lOiAwIH1cbiAgICAvLyAgICAgc3RlcHM6IFtcbiAgICAvLyAgICAgICAgIHtcbiAgICAvLyAgICAgICAgICAgICBhY3Rpb25Mb2NhdGlvbjoge1xuICAgIC8vICAgICAgICAgICAgICAgICB1cmk6IHN0cmluZ1xuICAgIC8vICAgICAgICAgICAgICAgICBsaW5lOiAwXG4gICAgLy8gICAgICAgICAgICAgfVxuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICBdXG4gICAgLy8gfVxuICAgIG9uVGVzdENhc2VQcmVwYXJlZCAodGVzdENhc2VQcmVwYXJlZEV2ZW50KSB7XG4gICAgICAgIHRoaXMudGVzdENhc2VQcmVwYXJlZEV2ZW50cy5wdXNoKHRlc3RDYXNlUHJlcGFyZWRFdmVudClcbiAgICAgICAgY29uc3Qgc291cmNlTG9jYXRpb24gPSB0ZXN0Q2FzZVByZXBhcmVkRXZlbnQuc291cmNlTG9jYXRpb25cbiAgICAgICAgY29uc3QgdXJpID0gc291cmNlTG9jYXRpb24udXJpXG5cbiAgICAgICAgY29uc3QgZG9jID0gdGhpcy5naGVya2luRG9jRXZlbnRzLmZpbmQoZ2RlID0+IGdkZS51cmkgPT09IHVyaSkuZG9jdW1lbnRcbiAgICAgICAgY29uc3Qgc2NlbmFyaW8gPSBkb2MuZmVhdHVyZS5jaGlsZHJlbi5maW5kKChjaGlsZCkgPT4gY29tcGFyZVNjZW5hcmlvTGluZVdpdGhTb3VyY2VMaW5lKGNoaWxkLCBzb3VyY2VMb2NhdGlvbikpXG5cbiAgICAgICAgY29uc3Qgc2NlbmFyaW9IYXNIb29rcyA9IHNjZW5hcmlvLnN0ZXBzLmZpbHRlcigoc3RlcCkgPT4gc3RlcC50eXBlID09PSAnSG9vaycpLmxlbmd0aCA+IDBcbiAgICAgICAgaWYgKHNjZW5hcmlvSGFzSG9va3MpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFsbFN0ZXBzID0gdGVzdENhc2VQcmVwYXJlZEV2ZW50LnN0ZXBzXG4gICAgICAgIGFsbFN0ZXBzLmZvckVhY2goKHN0ZXAsIGlkeCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFzdGVwLnNvdXJjZUxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgc3RlcC5zb3VyY2VMb2NhdGlvbiA9IHsgbGluZTogc3RlcC5hY3Rpb25Mb2NhdGlvbi5saW5lLCBjb2x1bW46IDAsIHVyaTogc3RlcC5hY3Rpb25Mb2NhdGlvbi51cmkgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGhvb2sgPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdIb29rJyxcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHN0ZXAuc291cmNlTG9jYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGtleXdvcmQ6ICdIb29rJyxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJydcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2NlbmFyaW8uc3RlcHMuc3BsaWNlKGlkeCwgMCwgaG9vaylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyB0ZXN0U3RlcEZpbmlzaGVkRXZlbnQgPSB7XG4gICAgLy8gICAgIGluZGV4OiAwLFxuICAgIC8vICAgICByZXN1bHQ6IHsgZHVyYXRpb246IDAsIHN0YXR1czogc3RyaW5nLCBleGNlcHRpb24/OiBFcnJvciB9LFxuICAgIC8vICAgICB0ZXN0Q2FzZToge1xuICAgIC8vICAgICAgICAgc291cmNlTG9jYXRpb246IHsgdXJpOiBzdHJpbmcsIGxpbmU6IDAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gfVxuICAgIG9uVGVzdFN0ZXBGaW5pc2hlZCAodGVzdFN0ZXBGaW5pc2hlZEV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZUxvY2F0aW9uID0gdGVzdFN0ZXBGaW5pc2hlZEV2ZW50LnRlc3RDYXNlLnNvdXJjZUxvY2F0aW9uXG4gICAgICAgIGNvbnN0IHVyaSA9IHNvdXJjZUxvY2F0aW9uLnVyaVxuXG4gICAgICAgIGNvbnN0IGRvYyA9IHRoaXMuZ2hlcmtpbkRvY0V2ZW50cy5maW5kKGdkZSA9PiBnZGUudXJpID09PSB1cmkpLmRvY3VtZW50XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBkb2MuZmVhdHVyZVxuICAgICAgICBjb25zdCBzY2VuYXJpbyA9IGZlYXR1cmUuY2hpbGRyZW4uZmluZCgoY2hpbGQpID0+IGNvbXBhcmVTY2VuYXJpb0xpbmVXaXRoU291cmNlTGluZShjaGlsZCwgc291cmNlTG9jYXRpb24pKVxuICAgICAgICBjb25zdCBzdGVwID0gZ2V0U3RlcEZyb21GZWF0dXJlKGZlYXR1cmUsIHRoaXMuY3VycmVudFBpY2tsZSwgdGVzdFN0ZXBGaW5pc2hlZEV2ZW50LmluZGV4LCBzb3VyY2VMb2NhdGlvbilcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGVzdFN0ZXBGaW5pc2hlZEV2ZW50LnJlc3VsdFxuXG4gICAgICAgIHRoaXMuZW1pdCgnYWZ0ZXItc3RlcCcsIHVyaSwgZmVhdHVyZSwgc2NlbmFyaW8sIHN0ZXAsIHJlc3VsdCwgc291cmNlTG9jYXRpb24pXG4gICAgfVxuXG4gICAgLy8gdGVzdENhc2VGaW5pc2hlZEV2ZW50ID0ge1xuICAgIC8vICAgICByZXN1bHQ6IHsgZHVyYXRpb246IDAsIHN0YXR1czogc3RyaW5nIH0sXG4gICAgLy8gICAgIHNvdXJjZUxvY2F0aW9uOiB7IHVyaTogc3RyaW5nLCBsaW5lOiAwIH1cbiAgICAvLyB9XG4gICAgb25UZXN0Q2FzZUZpbmlzaGVkICh0ZXN0Q2FzZUZpbmlzaGVkRXZlbnQpIHtcbiAgICAgICAgY29uc3Qgc291cmNlTG9jYXRpb24gPSB0ZXN0Q2FzZUZpbmlzaGVkRXZlbnQuc291cmNlTG9jYXRpb25cbiAgICAgICAgY29uc3QgdXJpID0gc291cmNlTG9jYXRpb24udXJpXG5cbiAgICAgICAgY29uc3QgZG9jID0gdGhpcy5naGVya2luRG9jRXZlbnRzLmZpbmQoZ2RlID0+IGdkZS51cmkgPT09IHVyaSkuZG9jdW1lbnRcbiAgICAgICAgY29uc3QgZmVhdHVyZSA9IGRvYy5mZWF0dXJlXG4gICAgICAgIGNvbnN0IHNjZW5hcmlvID0gZmVhdHVyZS5jaGlsZHJlbi5maW5kKChjaGlsZCkgPT4gY29tcGFyZVNjZW5hcmlvTGluZVdpdGhTb3VyY2VMaW5lKGNoaWxkLCBzb3VyY2VMb2NhdGlvbikpXG5cbiAgICAgICAgdGhpcy5lbWl0KCdhZnRlci1zY2VuYXJpbycsIHVyaSwgZmVhdHVyZSwgc2NlbmFyaW8sIHNvdXJjZUxvY2F0aW9uKVxuXG4gICAgICAgIHRoaXMuY3VycmVudFBpY2tsZSA9IG51bGxcbiAgICB9XG5cbiAgICAvLyB0ZXN0UnVuRmluaXNoZWRFdmVudCA9IHtcbiAgICAvLyAgICAgcmVzdWx0OiB7IGR1cmF0aW9uOiA0MDA0LCBzdWNjZXNzOiB0cnVlIH1cbiAgICAvLyB9XG4gICAgb25UZXN0UnVuRmluaXNoZWQgKCkge1xuICAgICAgICBjb25zdCBnaGVya2luRG9jRXZlbnQgPSB0aGlzLmdoZXJraW5Eb2NFdmVudHMucG9wKCkgLy8gc2VlIC5wdXNoKCkgaW4gYGhhbmRsZUJlZm9yZUZlYXR1cmUoKWBcbiAgICAgICAgY29uc3QgdXJpID0gZ2hlcmtpbkRvY0V2ZW50LnVyaVxuICAgICAgICBjb25zdCBkb2MgPSBnaGVya2luRG9jRXZlbnQuZG9jdW1lbnRcbiAgICAgICAgY29uc3QgZmVhdHVyZSA9IGRvYy5mZWF0dXJlXG5cbiAgICAgICAgdGhpcy5lbWl0KCdhZnRlci1mZWF0dXJlJywgdXJpLCBmZWF0dXJlKVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVTY2VuYXJpb0xpbmVXaXRoU291cmNlTGluZSAoc2NlbmFyaW8sIHNvdXJjZUxvY2F0aW9uKSB7XG4gICAgaWYgKHNjZW5hcmlvLnR5cGUuaW5kZXhPZignU2NlbmFyaW9PdXRsaW5lJykgPiAtMSkge1xuICAgICAgICByZXR1cm4gc2NlbmFyaW8uZXhhbXBsZXNbMF0udGFibGVCb2R5LnNvbWUoKHRhYmxlRW50cnkpID0+IHRhYmxlRW50cnkubG9jYXRpb24ubGluZSA9PT0gc291cmNlTG9jYXRpb24ubGluZSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NlbmFyaW8ubG9jYXRpb24ubGluZSA9PT0gc291cmNlTG9jYXRpb24ubGluZVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0ZXBGcm9tRmVhdHVyZSAoZmVhdHVyZSwgcGlja2xlLCBzdGVwSW5kZXgsIHNvdXJjZUxvY2F0aW9uKSB7XG4gICAgbGV0IGNvbWJpbmVkU3RlcHMgPSBbXVxuICAgIGZlYXR1cmUuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgaWYgKGNoaWxkLnR5cGUuaW5kZXhPZignU2NlbmFyaW8nKSA+IC0xICYmICFjb21wYXJlU2NlbmFyaW9MaW5lV2l0aFNvdXJjZUxpbmUoY2hpbGQsIHNvdXJjZUxvY2F0aW9uKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgY29tYmluZWRTdGVwcyA9IGNvbWJpbmVkU3RlcHMuY29uY2F0KGNoaWxkLnN0ZXBzKVxuICAgIH0pXG4gICAgY29uc3QgdGFyZ2V0U3RlcCA9IGNvbWJpbmVkU3RlcHNbc3RlcEluZGV4XVxuXG4gICAgaWYgKHRhcmdldFN0ZXAudHlwZSA9PT0gJ1N0ZXAnKSB7XG4gICAgICAgIGNvbnN0IHN0ZXBMaW5lID0gdGFyZ2V0U3RlcC5sb2NhdGlvbi5saW5lXG4gICAgICAgIGNvbnN0IHBpY2tsZVN0ZXAgPSBwaWNrbGUuc3RlcHMuZmluZChzID0+IHMubG9jYXRpb25zLnNvbWUobG9jID0+IGxvYy5saW5lID09PSBzdGVwTGluZSkpXG5cbiAgICAgICAgaWYgKHBpY2tsZVN0ZXApIHtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLnRhcmdldFN0ZXAsIHRleHQ6IHBpY2tsZVN0ZXAudGV4dCB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0U3RlcFxufVxuIl19