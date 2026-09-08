/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import CVOptimizer from "./components/CVOptimizer";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <CVOptimizer />
    </ErrorBoundary>
  );
}
