// Import tests directly so the runner also works in environments that disallow
// subprocess creation. node:test emits the report after all imports complete.
import './collegeboard-content.test.js';
import './assessment-content.test.js';
