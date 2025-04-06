// This file configures the testing environment for Vitest

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Add testing-library matchers
expect.extend(matchers)

// Clean up after each test
afterEach(() => {
  cleanup()
})
