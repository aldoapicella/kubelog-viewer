import { useState } from 'react';
import { NamespaceSelector } from './components/NamespaceSelector';
import { PodSelector } from './components/PodSelector';
import { SearchBar } from './components/SearchBar';
import { LogViewer } from './components/LogViewer';

function App() {
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [selectedPod, setSelectedPod] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sinceSeconds, setSinceSeconds] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Reset pod selection when namespace changes
  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
    setSelectedPod('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Kubernetes Log Viewer
          </h1>
          <p className="mt-2 text-gray-400">
            View real-time logs from your Kubernetes pods
          </p>
        </header>

        <div className="space-y-8">
          {/* Selection Controls */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-medium text-gray-200 mb-4">
              Pod Selection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NamespaceSelector
                selectedNamespace={selectedNamespace}
                onNamespaceChange={handleNamespaceChange}
              />
              <PodSelector
                namespace={selectedNamespace}
                selectedPod={selectedPod}
                onPodChange={setSelectedPod}
              />
            </div>
          </div>

          {/* Search and Filters */}
          {selectedPod && (
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-lg font-medium text-gray-200 mb-4">
                Search & Filters
              </h2>
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sinceSeconds={sinceSeconds}
                onSinceSecondsChange={setSinceSeconds}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
          )}

          {/* Log Viewer */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <LogViewer
              namespace={selectedNamespace}
              pod={selectedPod}
              sinceSeconds={sinceSeconds}
              searchTerm={searchTerm}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Kubernetes Log Viewer - Built with React, TypeScript, and Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
